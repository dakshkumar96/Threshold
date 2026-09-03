# Deploying the API to Oracle Cloud

Self-managed, no PaaS. This runs the FastAPI service via uvicorn under systemd,
fronted by nginx, on a plain Ubuntu OCI compute instance.

## 1. Provision the instance (OCI console)

- Compute → Create Instance. Ubuntu image. The Always Free ARM (Ampere) shape
  gives the most headroom for the fuzzy-matching workload; the free AMD micro
  shapes work too but are tighter on CPU.
- Attach a public IP.
- In the instance's VCN **Security List** (or a Network Security Group), add
  ingress rules for TCP 80 and 443 from `0.0.0.0/0`. This is separate from
  `ufw` on the box itself — OCI blocks traffic at the cloud level before it
  ever reaches the instance's own firewall, and it's the single most common
  reason "it works on curl locally but not from the internet."

## 2. On the instance

```bash
git clone https://github.com/dakshkumar96/Threshold.git
cd Threshold
chmod +x deploy/setup.sh
./deploy/setup.sh
```

The script installs Python/nginx/certbot, creates the venv, installs
dependencies, wires up the systemd service and nginx site, and opens the
instance's own firewall. It prints exactly what's left for you to do by hand
(fill in `.env`, put your IP/domain in the nginx config, start the service).
See the files themselves for what each step does:

- [`threshold-api.service`](threshold-api.service) — the systemd unit
- [`nginx-threshold-api.conf`](nginx-threshold-api.conf) — the reverse proxy
- [`.env.example`](.env.example) — every env var the API reads, with what each does

## 3. Data files

`sponsor_company_summary.parquet` and `sponsor_retention_scores.parquet` are
committed to the repo (force-added past `.gitignore`, since everything else
in `data/processed/` is regenerable QA output but these two are what the live
API actually reads at request time) — `git clone` brings them along, no
separate data step needed.

## 4. Once it's live

- `curl http://YOUR_IP/docs` should return the FastAPI Swagger page.
- Get HTTPS: point a domain's DNS at the instance, then
  `sudo certbot --nginx -d your-domain.com`.
- Update `CORS_ALLOW_ORIGINS` in `.env` to the real Vercel frontend URL, then
  `sudo systemctl restart threshold-api`.
- Update `NEXT_PUBLIC_API_URL` on the Vercel side to this instance's URL.

## Updating after a new push

```bash
cd ~/Threshold
git pull
source .venv/bin/activate && pip install -r requirements.txt && deactivate
sudo systemctl restart threshold-api
```

No auto-deploy-on-push here (that's what Render/Vercel give you for free) —
this is a manual pull + restart, or set up your own webhook/cron if you want
it automatic later.
