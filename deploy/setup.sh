#!/usr/bin/env bash
# Threshold API — Oracle Cloud instance setup.
#
# Run this FROM INSIDE the cloned repo, i.e.:
#   git clone https://github.com/dakshkumar96/Threshold.git
#   cd Threshold
#   chmod +x deploy/setup.sh
#   ./deploy/setup.sh
#
# Written for Ubuntu (the default OCI image). Idempotent-ish: safe to re-run.
set -euo pipefail

REPO_DIR="$(pwd)"
SERVICE_NAME="threshold-api"

echo "==> Installing system packages"
sudo apt-get update -y
sudo apt-get install -y python3 python3-venv python3-pip python3-dev build-essential \
  nginx certbot python3-certbot-nginx ufw

echo "==> Creating virtualenv"
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

echo "==> Checking .env"
if [ ! -f .env ]; then
  cp deploy/.env.example .env
  echo "    Created .env from deploy/.env.example — fill in the real values before starting the service:"
  echo "    nano .env"
  echo "    (REED_API_KEY, ADZUNA_APP_ID, ADZUNA_APP_KEY, LLM_API_KEY, LLM_BASE_URL, LLM_MODEL, CORS_ALLOW_ORIGINS)"
else
  echo "    .env already exists, leaving it alone."
fi

echo "==> Installing systemd service"
sudo cp deploy/threshold-api.service /etc/systemd/system/"$SERVICE_NAME".service
sudo sed -i "s#/home/ubuntu/Threshold#${REPO_DIR}#g" /etc/systemd/system/"$SERVICE_NAME".service
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"

echo "==> Installing nginx site"
sudo cp deploy/nginx-threshold-api.conf /etc/nginx/sites-available/"$SERVICE_NAME"
sudo ln -sf /etc/nginx/sites-available/"$SERVICE_NAME" /etc/nginx/sites-enabled/"$SERVICE_NAME"
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

echo "==> Opening firewall (ufw)"
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

cat <<'EOF'

==================================================================
Almost there. Three things still need YOU:

1. Fill in real values in .env (if this is the first run):
     nano .env

2. Edit deploy/nginx-threshold-api.conf (or the installed copy at
   /etc/nginx/sites-available/threshold-api) and replace
   YOUR_DOMAIN_OR_IP with your instance's public IP or domain, then:
     sudo nginx -t && sudo systemctl reload nginx

3. In the OCI console (not this shell): open your instance's VCN
   Security List / Network Security Group and allow ingress on
   ports 80 and 443. ufw alone is NOT enough on Oracle Cloud — the
   cloud-level firewall blocks traffic before it ever reaches ufw.

Then start the API:
     sudo systemctl start threshold-api
     sudo systemctl status threshold-api
     curl http://127.0.0.1:8000/docs

Once it's confirmed working, get HTTPS (needs a domain pointed at
this instance first):
     sudo certbot --nginx -d your-domain.com

Finally, tell Claude the public URL so CORS_ALLOW_ORIGINS here and
NEXT_PUBLIC_API_URL on the Vercel side can be wired together.
==================================================================
EOF
