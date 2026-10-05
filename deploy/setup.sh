#!/usr/bin/env bash
# Threshold API: set up a fresh Ubuntu server (Oracle Cloud or similar).
#
# Run it from inside the cloned repo:
#   git clone https://github.com/dakshkumar96/uk-sponsor-analysis.git
#   cd uk-sponsor-analysis
#   chmod +x deploy/setup.sh
#   ./deploy/setup.sh
#
# It installs Python 3.13 with uv (in your home folder, next to the system
# Python), creates the venv, installs the systemd service and an nginx site.
# Production uses Caddy instead of nginx, see deploy/Caddyfile.example.
# Safe to run again.
set -euo pipefail

REPO_DIR="$(pwd)"
SERVICE_NAME="threshold-api"

echo "==> Installing system packages"
sudo apt-get update -y
sudo apt-get install -y python3-pip nginx certbot python3-certbot-nginx ufw

echo "==> Installing uv and Python 3.13"
python3 -m pip install --user --quiet uv
UV="$HOME/.local/bin/uv"
"$UV" python install 3.13

echo "==> Creating the venv"
"$UV" venv --allow-existing --python 3.13 .venv
"$UV" pip install --python .venv/bin/python -r requirements.txt

echo "==> Checking .env"
if [ ! -f .env ]; then
  cp deploy/.env.example .env
  chmod 600 .env
  echo "    Created .env from deploy/.env.example. Fill in the real values before starting the service:"
  echo "    nano .env"
else
  echo "    .env already exists, leaving it alone."
fi

echo "==> Installing the systemd service"
sudo cp deploy/threshold-api.service /etc/systemd/system/"$SERVICE_NAME".service
sudo sed -i "s#/home/ubuntu/uk-sponsor-analysis#${REPO_DIR}#g" /etc/systemd/system/"$SERVICE_NAME".service
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"

echo "==> Installing the nginx site"
sudo cp deploy/nginx-threshold-api.conf /etc/nginx/sites-available/"$SERVICE_NAME"
sudo ln -sf /etc/nginx/sites-available/"$SERVICE_NAME" /etc/nginx/sites-enabled/"$SERVICE_NAME"
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

echo "==> Opening the firewall (ufw)"
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

cat <<'EOF'

==================================================================
Almost there. Three things are left for you:

1. Fill in the real values in .env (if this is the first run):
     nano .env

2. Edit /etc/nginx/sites-available/threshold-api and replace
   YOUR_DOMAIN_OR_IP with the server's public IP or domain, then:
     sudo nginx -t && sudo systemctl reload nginx

3. In the Oracle Cloud console (not this shell), open the instance's
   VCN Security List or Network Security Group and allow ingress on
   ports 80 and 443. ufw alone is not enough on Oracle Cloud, because
   the cloud firewall blocks traffic before it reaches the server.

Then start the API and check it:
     sudo systemctl start threshold-api
     sudo systemctl status threshold-api
     curl http://127.0.0.1:8000/health

For HTTPS, point a domain at the server, then:
     sudo certbot --nginx -d your-domain.com

Finally set CORS_ALLOW_ORIGINS in .env to the website's address, and
NEXT_PUBLIC_API_URL on Vercel to this server's HTTPS address.
==================================================================
EOF
