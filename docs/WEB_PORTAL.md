# CRM Pro Web Portal

React + TypeScript front end for the CRM Pro backend. Covers the
dashboard, customers, agents and payments.

Built across RC2.4A–E:

| Release | Scope |
| --- | --- |
| RC2.4A | Foundation: Vite, auth, routing, layout, dashboard |
| RC2.4B | Customers |
| RC2.4C | Agents, assigned-agent picker |
| RC2.4D | Payments |
| RC2.4E | Integration, QA, hardening, this document |

---

## 1. Folder structure

```
src/
├─ app/                      composition root — nothing feature-specific
│  ├─ providers/             every cross-cutting provider, in dependency order
│  ├─ router/                route tree and the single source of paths
│  └─ theme/                 Material UI theme
├─ config/                   build-time configuration
│  ├─ env.ts                 validated import.meta.env access
│  └─ list.ts                shared page-size / debounce defaults
├─ lib/                      framework-agnostic helpers, no React
│  ├─ api/                   Axios client, endpoints, envelope, error types
│  ├─ collection/            paginate, clampPage, collator
│  └─ format.ts              currency, number, date, orDash, parseNumeric
├─ hooks/                    cross-feature React hooks (useDebouncedValue)
├─ components/               cross-feature UI
│  ├─ data/DataTable.tsx     the one generic table
│  ├─ feedback/              loaders, empty, error, confirm, snackbar, boundary
│  └─ layout/                MainLayout, Sidebar, TopBar, UserMenu, navigation
├─ features/                 one folder per domain, each self-contained
│  ├─ auth/       api · components · context · hooks · pages · schemas · storage
│  ├─ dashboard/  api · components · hooks · pages
│  ├─ customers/  api · components · hooks · pages · schemas · utils
│  ├─ agents/     api · components · hooks · pages · schemas · utils
│  └─ payments/   api · components · hooks · schemas
└─ pages/                    routed pages that belong to no feature
```

**Dependency direction.** `features → components → lib → config`. A
feature never imports another feature's internals; anything two features
need is promoted to `lib/`, `hooks/` or `components/`. The one deliberate
exception is documented in §6.

---

## 2. Authentication flow

### Login

1. `LoginPage` validates with Zod (`loginSchema`).
2. `authApi.login` posts to `/auth/login`.
3. `AuthProvider.login` writes **storage first, then React state**. The
   request interceptor reads the token from storage, so setting state
   first would leave a render in which the app believes it is signed in
   but sends no `Authorization` header.
4. `AuthGate`/`ProtectedRoute` react to `isAuthenticated` and the router
   moves to the requested page, or `/dashboard`.

### Persistence

`localStorage`, under `crm_pro.auth.token` and `crm_pro.auth.user`. The
backend issues a 7-day token; `sessionStorage` would expire sessions far
sooner than the credential itself. Every read is defensive — storage can
throw, and its contents are user-editable, so a corrupt value degrades to
"signed out" rather than crashing on boot.

The cached user object is a **display cache only**. It is never treated as
proof of a session.

### Session restore (page refresh)

`AuthProvider` starts with `isRestoringSession: true`.

| Situation | Result |
| --- | --- |
| No stored token | Signed out immediately, no request |
| Token accepted by `GET /auth/profile` | Signed in |
| Token rejected (401) | Storage cleared, signed out |
| Backend unreachable | Signed out, **token kept** |

The last row matters: "I couldn't ask" is not "the server said no", and
discarding a valid session over a network blip forces a needless
re-login.

`ProtectedRoute` waits on `isRestoringSession` before deciding anything.
Without that, every refresh on a protected page would flash the login
screen while the check was in flight.

### Token expiry

The Axios response interceptor owns this. A 401 on any request except
login clears storage and calls the handler `AuthProvider` registered at
mount, which drops React state and clears the React Query cache. The
interceptor runs outside React and cannot call `setState` itself — that
registration is the bridge.

A 401 **on the login request** is not treated as expiry: there it means
wrong password, and clearing/redirecting would be both wrong and circular.

### Authorisation

- `ProtectedRoute` — authentication. Wraps a branch, so a page added
  beneath it is protected by default.
- `RoleRoute allow={['admin']}` — authorisation. Always nested inside
  `ProtectedRoute`, so it never has to consider the loading case.

Both are **usability guards, not security boundaries.** The backend
authorises every request from the JWT independently.

---

## 3. Routing

```
/login                          public
└── ProtectedRoute
    └── MainLayout
        └── Suspense
            ├── /dashboard
            ├── /customers
            ├── /customers/new
            ├── /customers/:customerId
            ├── /customers/:customerId/edit
            ├── /payments                  placeholder
            └── RoleRoute allow={['admin']}
                ├── /agents
                ├── /agents/new
                └── /agents/:agentId/edit
*  → /dashboard
```

- Every path lives in `app/router/routes.ts`. Nothing navigates with a
  hand-typed string.
- `/customers/new` is declared **before** `/customers/:customerId`, or
  "new" would be matched as an id. Same for agents.
- Payments have no page of their own — they are a tab on customer
  details. `/payments` remains a placeholder.
- Unknown URLs land on `/dashboard`, which bounces to `/login` when there
  is no session, so a bad URL never shows a blank screen.

---

## 4. React Query strategy

### Client defaults (`AppProviders`)

| Option | Value | Why |
| --- | --- | --- |
| `refetchOnWindowFocus` | `false` | Admin figures don't change second to second |
| `staleTime` | 60 s | Avoids refetching on every remount |
| `retry` (queries) | skip 4xx, else 2 | A 403/404 never starts succeeding |
| `retry` (mutations) | `false` | Replaying a POST could double-charge |

### Query keys

```
['dashboard','stats']
['customers']                                   → invalidate the feature
  ['customers','list',{search}]                 → browse (whole collection)
  ['customers','list','search',{search,page,pageSize}]
  ['customers','detail', id]
['agents']
  ['agents','list']                             → the one cached collection
['payments']
  ['payments','history', customerId]
```

Hierarchical so a mutation invalidates a prefix rather than enumerating
every cached page.

**Browse keys deliberately omit page/size/sort.** `GET /customers` and
`GET /agents` return the whole collection with no parameters, so paging
and sorting happen in memory — including them would refetch on every page
turn for no new data. Search keys *do* include them, because each page is
a distinct server call.

### Invalidation after mutations

| Mutation | Invalidates |
| --- | --- |
| Customer create / update | `['customers','list']`, seeds `detail` |
| Customer delete | removes `detail`, invalidates lists |
| Agent create / update / toggle | `['agents']` |
| Agent delete | `['agents']` **and** `['customers']` |
| Payment create / delete | payment history, customer detail, customer lists, `['dashboard']` |

Two of these are cross-feature on purpose. Deleting an agent changes the
joined agent name on customer rows. Recording a payment can flip `is_vip`
and always moves dashboard revenue — both computed server-side, so the
only way to learn the new values is to ask.

Mutations **do not** optimistically fabricate rows. A created record's id
and timestamps are only knowable from the response; guessing would
flicker and be replaced a moment later. Detail caches are seeded from the
response instead.

---

## 5. Component architecture

**Shared, generic** (`src/components`)

| Component | Notes |
| --- | --- |
| `DataTable<Row>` | Generic over the row type, so `render` receives a real `Customer` and a mistyped field is a build error. Owns layout, sorting affordances, skeleton, empty body, keyboard rows. Owns no fetching and no sort logic. |
| `ConfirmDialog` | Every destructive confirmation. Error renders *inside* the dialog, dismissal blocked while busy. |
| `NotificationSnackbar` | Transient success. Bottom-left, so it never covers the primary action. |
| `LoadingState` · `FullPageLoader` · `TableSkeleton` · `EmptyState` · `ErrorState` · `PageError` | Four distinct states, never conflated: loading, empty, recoverable error, terminal error. |
| `AppErrorBoundary` | Last line of defence against a render crash. |

**Feature components** wrap the shared ones with domain knowledge:
`CustomerForm`, `AgentForm`, `PaymentForm` (one form each for create and
edit — mode drives the differences), `PaymentTable`/`AgentTable` (column
definitions over `DataTable`), status chips, `VipBadge`,
`AssignedAgentField`.

---

## 6. Feature modules

| Feature | Endpoints | Notes |
| --- | --- | --- |
| auth | `POST /auth/login`, `GET /auth/profile` | Session ownership |
| dashboard | `GET /dashboard` | Five headline figures |
| customers | `GET/POST /customers`, `GET /customers/search`, `GET/PUT/DELETE /customers/:id` | Browse vs search dual mode |
| agents | `GET/POST /agents`, `PUT/DELETE /agents/:id` | Admin-only |
| payments | `GET/POST /payments`, `DELETE /payments/:id` | Rendered as a customer tab |

**The one cross-feature import.** `customers/components/AssignedAgentField`
imports `agents/hooks/useAgents`. Duplicating the agent query to avoid it
would be worse — two caches for one collection. It is a read-only
dependency on a public hook, not on agent internals.

---

## 7. API integration

All traffic goes through `lib/api/client.ts`:

- base URL from `env.apiBaseUrl`; 30-second timeout (without one, Axios
  waits forever and a silent backend hangs the UI);
- `Authorization` attached per request, read fresh from storage;
- errors normalised to `ApiError` with a `kind` of `network`,
  `unauthorized`, `forbidden`, `client` or `server`, so components branch
  on meaning rather than status numbers.

Two backend behaviours every module must respect:

1. **A 200 can carry `success: false`.** `ensureSuccess` checks the
   envelope; the status alone is not enough.
2. **`NUMERIC` arrives as a string.** node-postgres serialises money
   columns as `"250.00"` to protect precision. `parseNumeric` is the one
   coercion point; a bare cast puts a string into a `number` field.

---

## 8. Coding conventions

- **TypeScript strict**, plus `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`. No `any`; unknown API data enters as
  `unknown` and is narrowed.
- **Wire names are kept** (`first_name`, `paid_at`, `note`). Renaming only
  hides a mismatch from whoever next reads a network tab.
- **`| null`, not `?`,** for API fields — Postgres returns the key with a
  null value.
- **Blank means null on the way out.** Form transforms convert `''` to
  `null`; an empty string in the database is not "unset".
- **Controlled inputs never receive `null`** — that flips them to
  uncontrolled and warns.
- Comments explain **why**, not what.

---

## 9. Environment variables

| Variable | Required | Example |
| --- | --- | --- |
| `VITE_API_BASE_URL` | yes | `http://97.74.89.70:3000/api` |

Include `/api`; a trailing slash is stripped automatically. Only `VITE_`
prefixed variables reach client code — **anything here is public**, so no
secret may ever be added to this file.

`config/env.ts` throws at startup if it is missing, rather than letting
requests fail later against `undefined/customers`.

`.env.example` is committed; `.env` is git-ignored.

---

## 10. Deployment

```bash
npm ci                 # reproducible install
npm run lint           # oxlint
npm run build          # tsc -b && vite build  →  dist/
npm run preview        # serve dist/ locally to verify
```

`dist/` is a static bundle — any static host or Nginx will serve it.

**SPA fallback is mandatory.** The router is history-based, so a deep link
such as `/customers/abc` must return `index.html` rather than a 404:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**CORS.** The backend runs `cors()` with no origin restriction, so a
deployed portal is accepted as-is. Lock this down to the portal's origin
before production.

**HTTPS.** The backend is currently plain HTTP. A portal served over HTTPS
cannot call it — browsers block mixed content. Either serve both over
HTTPS (correct) or both over HTTP (temporary).

---

## 11. Known constraints

Backend limitations the portal works around. None are defects here.

| Constraint | Consequence |
| --- | --- |
| `GET /customers` has no page/limit/sort | Browse fetches all, pages and sorts in memory |
| `GET /customers/search` has no sort | Search results order within the current page only; the UI says so |
| `GET /agents` takes no parameters | Search, sort and paging are client-side |
| No `GET /agents/:id` | The edit page reads from the cached list |
| Agent role is hard-coded server-side | Role is shown, never chosen |
| Agent email is not updatable | Read-only on edit |
| No `PUT /payments/:id` | Payments can be recorded and deleted, never edited |
| `GET /payments` has no pagination | Full history, newest first, unsorted by design |
| VIP is never revoked | A customer can show VIP with totals below the threshold |
| Customer PUT is partial **only since RC2.3.1** | Against an older server, editing nulls untouched columns |
