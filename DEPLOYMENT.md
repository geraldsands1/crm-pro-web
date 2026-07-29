# CRM Pro — Frontend Production Deployment (RC3.0)

Deploy the React/Vite portal to the same Ubuntu VPS that already runs the
backend, served by Nginx over HTTPS at your domain, with `/api` reverse-proxied
to the existing Node/Express + PM2 backend on `127.0.0.1:3000`.

Nothing about the backend, database, or PM2 changes. This is a static-site
deploy plus one new Nginx server block.

```
                        ┌──────────────────────── Ubuntu VPS ────────────────────────┐
Browser ──HTTPS──▶ Nginx :443
  https://crm.royalsofttechnology.com          │  /            → /var/www/crm-pro-web/current (React build)
                                   │  /api/…        → proxy → 127.0.0.1:3000 (Express, PM2)  │
                                   └─────────────────────────────────────────────────────────┘
```

Replace `crm.royalsofttechnology.com` with your real domain and `97.74.89.70` with your VPS
IP throughout. Commands prefixed `#` run **on the VPS** (as a sudo-capable user);
commands prefixed `>` run **locally** on your Windows machine.

---

## Prerequisites

- A domain (or subdomain) with a **DNS A record pointing to `97.74.89.70`**.
  Verify before starting TLS: `dig +short crm.royalsofttechnology.com` should return the IP.
- Backend already live and reachable locally on the VPS: `curl -s http://127.0.0.1:3000/api/health` (or any known route) responds.
- Node.js 20+ and npm on whichever machine performs the build.
- Nginx and certbot installed on the VPS:
  `sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx`

---

## 1 & 2. Configure the Vite production build and build the files

The production API base is already set: `.env.production` contains
`VITE_API_BASE_URL=/api`. Vite loads it automatically for `vite build`, so the
bundle calls the API at the same origin. Your dev `.env` (direct `:3000`) is
untouched, so `npm run dev` on Windows still works as before.

**Recommended: build on the VPS** (avoids shipping OS-specific artifacts and
matches the server's Node version). Pull the repo the same way you deploy the
backend, then:

```bash
# cd /path/to/crm-pro-web on the VPS
# npm ci            # clean, lockfile-exact install (includes devDeps: tsc, vite)
# npm run build     # runs `tsc -b && vite build` → outputs ./dist
```

**Alternative: build locally on Windows**, then upload `dist/` (step 3):

```powershell
> npm ci
> npm run build     # produces .\dist
```

Either way the deliverable is the `dist/` folder (hashed `assets/` + `index.html`).

---

## 3. Upload the build to the VPS (atomic releases)

Use a timestamped release directory and a `current` symlink so a deploy is
atomic and instantly reversible. One-time setup on the VPS:

```bash
# sudo mkdir -p /var/www/crm-pro-web/releases
# sudo mkdir -p /var/www/certbot          # for the ACME challenge (step 5)
# sudo chown -R $USER:$USER /var/www/crm-pro-web
```

If you **built on the VPS**, publish the freshly built `dist/`:

```bash
# REL=/var/www/crm-pro-web/releases/$(date +%Y%m%d%H%M%S)
# mkdir -p "$REL" && cp -r dist/* "$REL"/
# ln -sfn "$REL" /var/www/crm-pro-web/current
```

If you **built locally**, rsync `dist/` up, then flip the symlink:

```powershell
> $REL = "/var/www/crm-pro-web/releases/$(Get-Date -Format yyyyMMddHHmmss)"
> rsync -avz --delete .\dist\ deploy@97.74.89.70:"$REL/"
> ssh deploy@97.74.89.70 "ln -sfn $REL /var/www/crm-pro-web/current"
```

Let Nginx read the files:
`sudo chown -R www-data:www-data /var/www/crm-pro-web/releases`

---

## 4, 5 & 6. Nginx + HTTPS (order matters on the first deploy)

**Important ordering:** the main config's 443 block references the Let's Encrypt
cert files, which do not exist yet on a first deploy — so loading it before the
cert is issued makes `nginx -t` fail. Use the two-phase sequence below. On later
redeploys the cert already exists, so you skip straight to the main config.

**Phase 1 — bootstrap + issue the certificate (first deploy only):**

```bash
# sudo mkdir -p /var/www/certbot
# sudo cp deploy/nginx/crm-pro-web-bootstrap.conf /etc/nginx/sites-available/
# sudo ln -sfn /etc/nginx/sites-available/crm-pro-web-bootstrap.conf /etc/nginx/sites-enabled/
# sudo nginx -t && sudo systemctl reload nginx
# sudo certbot certonly --webroot -w /var/www/certbot -d crm.royalsofttechnology.com
```

**Phase 2 — swap in the real config:**

```bash
# sudo rm /etc/nginx/sites-enabled/crm-pro-web-bootstrap.conf
# sudo cp deploy/nginx/crm-pro-web.conf /etc/nginx/sites-available/crm-pro-web.conf
# sudo ln -sfn /etc/nginx/sites-available/crm-pro-web.conf /etc/nginx/sites-enabled/crm-pro-web.conf
# sudo nginx -t          # now passes — the cert exists
# sudo systemctl reload nginx
```

Renewal is automatic via the certbot systemd timer; confirm with
`sudo certbot renew --dry-run`.

Requirement 6 (refresh support) is handled by `try_files $uri $uri/ /index.html;`
in `location /`: because the app uses **BrowserRouter**, deep links like
`/customers/123` are not real files on disk. Without this rule a hard refresh
would 404; with it, Nginx serves `index.html` and React Router takes over.
`index.html` is sent `Cache-Control: no-cache` so each deploy is picked up
immediately, while hashed `/assets/*` are cached for a year.

---

## 7. Environment variables

Frontend: the only variable is `VITE_API_BASE_URL`, and it is **baked into the
bundle at build time** (Vite inlines `VITE_*` vars) — there is no runtime env on
the static site. Production value `/api` lives in `.env.production`. To change
the API location, edit that file and rebuild (steps 2–3).

Backend: no changes required. Because the browser now calls `/api` on the **same
origin**, there is no cross-origin request, so no new CORS configuration is
needed. The Node app keeps its existing `.env` and PM2 process. (If you had
previously added a CORS allow-list entry for the dev origin, you can leave it.)

---

## 8. Verify production

Work top-down; each check isolates one layer.

```bash
# TLS + app shell load:
#   curl -I https://crm.royalsofttechnology.com            → 200, and index.html headers
# API reachable through the same-origin proxy (not the raw port):
#   curl -i https://crm.royalsofttechnology.com/api/health → backend JSON, 200
# Backend still bound locally only (defense in depth):
#   curl -s http://127.0.0.1:3000/api/health   → 200 on the VPS
```

In a browser:

1. Open `https://crm.royalsofttechnology.com` — padlock shows, login page renders.
2. Sign in — dashboard loads real data (confirms `/api` proxy + auth header).
3. Navigate to a deep route (e.g. a customer profile) and **hard-refresh (Ctrl+Shift+R)** — the page reloads correctly instead of 404 (confirms the SPA fallback / requirement 6).
4. Open DevTools → Network — API calls go to `https://crm.royalsofttechnology.com/api/...` (relative, same origin), **not** `http://97.74.89.70:3000`, and there are no CORS or mixed-content errors.
5. Confirm the **Assigned Agent** now shows on a customer profile (the RC2.9A fix), verifying the deployed build is current.

---

## Redeploy (routine) & rollback

**Redeploy:** repeat steps 2–3 (build → new release dir → flip `current` symlink).
No Nginx reload needed; the symlink swap is atomic.

**Rollback:** point `current` back at the previous release and you're done —
```bash
# ls -1t /var/www/crm-pro-web/releases            # find the prior timestamp
# ln -sfn /var/www/crm-pro-web/releases/<PREV> /var/www/crm-pro-web/current
```

Old releases are cheap to keep; prune with e.g.
`ls -1dt /var/www/crm-pro-web/releases/* | tail -n +6 | xargs rm -rf` to retain the last 5.
