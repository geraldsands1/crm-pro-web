# CRM Pro — Production Deployment Checklist (RC3.0)

Domain: **crm.royalsofttechnology.com**  ·  VPS: **97.74.89.70**
Run in order. `>` = Windows PC (PowerShell).  `#` = VPS (SSH, sudo-capable user).

> ⚠️ Pre-flight (once): confirm DNS is live before touching TLS.
> `> nslookup crm.royalsofttechnology.com`  → must return 97.74.89.70

---

## WINDOWS PC

### Build (pre-flight — confirm it compiles with the production env)
```
> cd C:\Users\onlin\OneDrive\Desktop\crm-pro-web
> npm ci
> npm run build
```
`npm run build` runs `tsc -b && vite build`, loads `.env.production`
(`VITE_API_BASE_URL=/api`), and outputs `.\dist`.

### Git (publish source so the VPS builds the exact same code)
```
> git add .env.production deploy/nginx/crm-pro-web.conf deploy/nginx/crm-pro-web-bootstrap.conf DEPLOYMENT.md DEPLOYMENT_CHECKLIST.md
> git commit -m "RC3.0: production frontend deploy config (crm.royalsofttechnology.com)"
> git push origin main
```

### Upload
The VPS builds from git (next section), so the `git push` above **is** the upload.
Optional alternative — ship the local build instead of building on the VPS:
```
> rsync -avz --delete .\dist\ deploy@97.74.89.70:/tmp/crm-dist/
```

---

## VPS

```
# ssh deploy@97.74.89.70
```

### Git pull (get the latest frontend source)
```
# cd /var/www/crm-pro-web/source        # first time: git clone <repo-url> to this path, then cd
# git pull origin main
```

### Build (authoritative build on the server)
```
# npm ci
# npm run build                          # -> ./dist  (uses .env.production => /api)
```

### Copy build (atomic release + current symlink)
```
# sudo mkdir -p /var/www/crm-pro-web/releases /var/www/certbot
# REL=/var/www/crm-pro-web/releases/$(date +%Y%m%d%H%M%S)
# sudo mkdir -p "$REL"
# sudo cp -r dist/* "$REL"/
# sudo ln -sfn "$REL" /var/www/crm-pro-web/current
# sudo chown -R www-data:www-data /var/www/crm-pro-web/releases
```

### Enable Nginx + Test + Certbot + Reload

**FIRST DEPLOY ONLY — Phase 1: bootstrap and issue the TLS certificate**
```
# sudo cp deploy/nginx/crm-pro-web-bootstrap.conf /etc/nginx/sites-available/
# sudo ln -sfn /etc/nginx/sites-available/crm-pro-web-bootstrap.conf /etc/nginx/sites-enabled/
# sudo nginx -t
# sudo systemctl reload nginx
# sudo apt install -y certbot            # if not already installed
# sudo certbot certonly --webroot -w /var/www/certbot -d crm.royalsofttechnology.com
```

**FIRST DEPLOY ONLY — Phase 2: swap in the real config**
```
# sudo rm /etc/nginx/sites-enabled/crm-pro-web-bootstrap.conf
# sudo cp deploy/nginx/crm-pro-web.conf /etc/nginx/sites-available/crm-pro-web.conf
# sudo ln -sfn /etc/nginx/sites-available/crm-pro-web.conf /etc/nginx/sites-enabled/crm-pro-web.conf
# sudo nginx -t                          # must say "test is successful"
# sudo systemctl reload nginx
```

**ROUTINE REDEPLOY (cert already exists) — nginx is already configured.**
The symlink swap in "Copy build" is the whole deploy; no nginx reload needed.
Only if you changed the nginx config: `# sudo nginx -t && sudo systemctl reload nginx`

### Verify deployment
```
# curl -I https://crm.royalsofttechnology.com                 # 200, valid TLS
# curl -i https://crm.royalsofttechnology.com/api/auth/profile # 401 (reachable through /api proxy, no CORS)
# curl -s http://127.0.0.1:3000/api/auth/profile              # backend still bound locally
```
Then in a browser: load the site (padlock), sign in (dashboard data loads),
open a deep route and hard-refresh (no 404), and check DevTools → Network that
API calls go to `https://crm.royalsofttechnology.com/api/...` — never `:3000`.

---

## Rollback

**App rollback (bad build) — instant, atomic symlink flip:**
```
# ls -1t /var/www/crm-pro-web/releases                        # find the previous timestamp
# sudo ln -sfn /var/www/crm-pro-web/releases/<PREVIOUS> /var/www/crm-pro-web/current
# (no reload needed; refresh the browser)
```

**Nginx config rollback (bad config) — you kept the old file:**
```
# sudo cp /etc/nginx/sites-available/crm-pro-web.conf.bak /etc/nginx/sites-available/crm-pro-web.conf
# sudo nginx -t && sudo systemctl reload nginx
```
> Tip: before overwriting the nginx config on a later change, back it up first:
> `# sudo cp /etc/nginx/sites-available/crm-pro-web.conf{,.bak}`

**Full disable (take the frontend offline, leave the API untouched):**
```
# sudo rm /etc/nginx/sites-enabled/crm-pro-web.conf
# sudo systemctl reload nginx
```
The backend (PM2 on :3000) is never modified by any step here, so no backend rollback exists or is needed.
