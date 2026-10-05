# Deploying the API

## How production runs

| Piece | Where |
|---|---|
| Website | Vercel, built from `main` on every push |
| API | Oracle Cloud VM (Ubuntu 20.04, ARM, 1 CPU, 6 GB), folder `/home/ubuntu/uk-sponsor-analysis` |
| Python | 3.13, installed with [uv](https://docs.astral.sh/uv/) in the `ubuntu` user's home folder. The venv is `.venv` |
| Process | systemd service `threshold-api` ([threshold-api.service](threshold-api.service)): uvicorn with 2 workers on `127.0.0.1:8000` |
| HTTPS | Caddy in Docker, shared with another app on the same VM. The Threshold block is in [Caddyfile.example](Caddyfile.example) |
| Domain | `threshold-backend.duckdns.org` |
| Settings | `.env` in the repo folder, readable only by `ubuntu`. Every setting is described in [.env.example](.env.example) |

The two register files the API reads (`data/processed/sponsor_company_summary.parquet` and `sponsor_retention_scores.parquet`) are committed to the repo, so `git clone` brings them along. The SQLite files (`data/ats_map.db`, `data/user_data.db`) are created on first start and are not in git.

## Updating after a push

```bash
cd ~/uk-sponsor-analysis
git pull
~/.local/bin/uv pip install --python .venv/bin/python -r requirements.txt
sudo systemctl restart threshold-api
curl -s http://127.0.0.1:8000/health
```

The service waits up to 220 seconds for running searches to finish before it restarts.

## Checking it is healthy

```bash
systemctl status threshold-api
journalctl -u threshold-api -n 50 --no-pager
curl -s https://threshold-backend.duckdns.org/health
```

Each search logs one line with how long each step took, for example `Search finished: read_cv=0.0s job_boards=6.1s register_match=3.2s skills_and_sponsors=0.4s cv_review=21.5s total=31.2s`.

## Rolling back

```bash
cd ~/uk-sponsor-analysis
git log --oneline -5                 # pick the commit to go back to
git reset --hard <commit>
~/.local/bin/uv pip install --python .venv/bin/python -r requirements.txt
sudo systemctl restart threshold-api
```

## Setting up a new server

```bash
git clone https://github.com/dakshkumar96/Threshold.git
cd Threshold
chmod +x deploy/setup.sh
./deploy/setup.sh
```

[setup.sh](setup.sh) installs Python 3.13 with uv, creates the venv, installs the systemd service, sets up nginx for HTTPS and opens the firewall. It then prints what is left to do by hand: fill in `.env`, put your domain in the nginx site, and open ports 80 and 443 in the Oracle Cloud console (the cloud firewall blocks traffic before it reaches the server's own firewall).

To use Caddy instead of nginx, skip the nginx part and add the block from [Caddyfile.example](Caddyfile.example) to your Caddyfile.

## Settings that matter in production

- `CLERK_ISSUER` must be set, or saved searches and the profile page answer 503. The API only trusts sign-in tokens signed by the keys at this address.
- `CORS_ALLOW_ORIGINS` must list the website's address.
- Leave `APP_ENV` unset (it defaults to production). Production turns off the `/docs` pages, and the API refuses to start if `CLERK_DEV_BYPASS=1` is set.
