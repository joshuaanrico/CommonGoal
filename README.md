# CommonGoal

A1.2 (V1), A1.3 (V2) and A3 (V3) application development for FIT5032. Vue 3, Vue
Router, Bootstrap 5, PrimeVue, Firebase (Auth, Firestore, Hosting, Cloud
Functions), Mapbox, Brevo.

**Live site:** https://commongoal-4a77b.web.app

CommonGoal is a fictional Melbourne not-for-profit that helps community sports
clubs go climate-ready and makes active travel (walking, riding, scooting) the
default way families reach training, games and school. Based in Greenvale VIC
3059.

## Pages and Business Requirements

| Page | Route | Demonstrates |
|---|---|---|
| Home | `/` | **BR A.2**, responsive hero, audience cards and impact stats across all breakpoints |
| Routes | `/routes` | **BR B.2**, local `routes.json` data rendered with `v-for`, live search and shade filter via `computed`. Each card also carries **BR C.3** rating and averaging |
| Join | `/join` | **BR B.1**, form with required field, email format and number range validation, submissions listed in a PrimeVue DataTable |
| Register | `/register` | **BR C.1**, creates a Firebase Auth user and a Firestore `users` doc, always `role: 'member'` |
| Log in | `/login` | **BR C.1**, one generic error message for every failure so the app never confirms which emails have accounts |
| Dashboard | `/dashboard` | **BR C.2**, signed-in only. Greets by name, shows role, different panel for member and admin |
| Admin console | `/admin` | **BR C.2** and **C.3**, admin only. All registered users, and the rating average and count per route |
| Access denied | `/access-denied` | Lands here when a signed-in member tries `/admin` by typing the URL |

**BR A.1** (framework, structure, routing) applies across the whole app: Vue 3
Composition API, Vue Router, and components split under `src/components/` and
`src/views/`.

## A3 additions (BR D, E, F)

| BR | Feature | Where | How it works |
|---|---|---|---|
| **D.1** | External sign-in | `/login`, `/register`, `src/stores/auth.js`, `GoogleSignInButton.vue` | Firebase Auth with Email/Password **and Google**. A first Google sign-in creates a `member` profile, same Firestore rules apply. HTTPS comes from Firebase Hosting |
| **D.2** | Email with attachment | `/share`, `src/views/ShareRouteView.vue`, function `sendEmail` | Browser sends the form and the file (base64) to a Cloud Function. It checks the Firebase ID token, validates input, allows PDF, PNG, JPG, TXT, CSV up to 2 MB, rate limits to 5 per 10 min, then calls the Brevo REST API. The Brevo key is in Google Secret Manager, never in the browser |
| **D.3** | Interactive tables | `/clubs` (50 rows), `/events` (40 rows), `/admin` | PrimeVue `DataTable`: sort on every column, global search, a filter under each column, 10 rows per page |
| **D.4** | Deployed | https://commongoal-4a77b.web.app | Firebase Hosting, SPA rewrite so deep links work, security headers, long cache for hashed assets |
| **E.1** | Cloud Functions | `functions/index.js` | `onRatingWritten` (Firestore trigger, keeps `routeStats` correct), `rebuildRouteStats`, `setUserRole` (admin only, audit log), `sendEmail`, `sendBulkEmail`, `api`. Region australia-southeast2 |
| **E.2** | Map | `/map`, `src/utils/mapbox.js` | Mapbox GL JS map with a pin per route, place search (Geocoding API), walking or riding directions with distance, time and turn by turn steps (Directions API), "use my location" |
| **E.3** | Accessibility (WCAG 2.1 AA) | whole app | Skip link, page titles and focus moved on navigation, labelled inputs with `aria-invalid` and `aria-describedby`, errors announced with `role="alert"`, `autocomplete` on forms, labelled rating buttons, visible focus ring, reduced motion respected, text alternative for the map and charts. Lighthouse accessibility 100 on every page tested |
| **E.4** | Export | Clubs, Events and Admin tables | CSV (UTF-8, Excel safe, formula injection safe) and PDF (jsPDF). Exports exactly the rows you see after filtering and sorting |
| **F.1** | Admin dashboard | top of `/admin` | Live counts: users, members and admins, new this week, ratings, average, emails sent, most rated route |
| **F.1** | Interactive charts | `/admin`, `AdminCharts.vue` | Chart.js from live Firestore data: average rating per route (click a bar for the breakdown), users by role, ratings per day |
| **F.1** | Bulk email | `/admin`, `BulkEmailDialog.vue`, function `sendBulkEmail` | Admin ticks users, writes one message with `{{name}}`. Server checks the caller is an admin, looks up addresses itself, sends each person their own copy |
| **F.1** | Public REST API | `/api-docs`, `functions/api.js` | Read only JSON API at `/api/routes`, `/api/routes/:id`, `/api/routes/:id/stats`, `/api/clubs`, `/api/clubs/:id`. Paging, filters, 400/404/405 errors, CORS, caching, "Try it" docs page |

### Cloud Functions

| Function | Trigger | Who can call it |
|---|---|---|
| `onRatingWritten` | Firestore `ratings/{id}` written | Firestore only |
| `rebuildRouteStats` | HTTP POST | admin |
| `setUserRole` | HTTP POST | admin (cannot change own role) |
| `sendEmail` | HTTP POST | any signed in user |
| `sendBulkEmail` | HTTP POST | admin |
| `api` | HTTP GET | anyone (public data only) |

Every protected function checks `Authorization: Bearer <Firebase ID token>` with
the Admin SDK (`verifyIdToken`), then reads the caller's role from `users/{uid}`.
No token or a bad token gives 401, a non admin gives 403.

### Test accounts

- Admin: `admin@commongoal.org` / `[password removed]`
- Member: register at `/register`, or use **Continue with Google**

### Setup (local)

```sh
cd assignment/commongoal
npm install
npm run dev
```

Needs `.env.local` (see `.env.example`):

| Variable | What it is |
|---|---|
| `VITE_FIREBASE_*` | Firebase web config (public by design, protected by the Firestore rules) |
| `VITE_MAPBOX_TOKEN` | Mapbox public token (`pk.`), restrict it to your site URLs |
| `VITE_PRIMEUI_LICENSE` | PrimeUI Community license key (free for students) |
| `VITE_FUNCTIONS_BASE_URL` | Optional, base URL of the Cloud Functions |

Cloud Functions (needs the Firebase CLI and the Blaze plan):

```sh
cd functions && npm install && cd ..
firebase functions:secrets:set BREVO_API_KEY   # paste the Brevo API key when asked
firebase deploy --only functions
```

Deploy the site:

```sh
npm run build
firebase deploy --only hosting
```

### Security notes (A3)

- The Brevo API key lives in Google Secret Manager. Only `sendEmail` and `sendBulkEmail` can read it.
- Roles can change only through the `setUserRole` function. The Firestore rules block any client from writing a role.
- `routeStats` can only be written by the `onRatingWritten` function, so a rating average cannot be faked.
- Every function validates its input again on the server, because browser checks can be bypassed.
- Email rate limits: 5 single emails and 3 bulk sends per user per 10 minutes.
- The public API is GET only and exposes no personal data.
- CSV export neutralises cells starting with `=`, `+`, `-` or `@`.

### Mock data

`clubs.json` and `events.json` are generated test data (Mockaroo style), not real clubs or events.

### A3 references

- [Firebase Hosting](https://firebase.google.com/docs/hosting), [Cloud Functions](https://firebase.google.com/docs/functions), [Secret Manager with Functions](https://firebase.google.com/docs/functions/config-env)
- [Firebase Auth, Google sign-in](https://firebase.google.com/docs/auth/web/google-signin)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/), [Geocoding API](https://docs.mapbox.com/api/search/geocoding/), [Directions API](https://docs.mapbox.com/api/navigation/directions/)
- [Brevo transactional email API](https://developers.brevo.com/reference/sendtransacemail)
- [PrimeVue DataTable](https://primevue.org/datatable/), [Chart](https://primevue.org/chart/), [Dialog](https://primevue.org/dialog/)
- [Chart.js](https://www.chartjs.org/docs/), [jsPDF](https://github.com/parallax/jsPDF), [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- [WCAG 2.1 quick reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Express](https://expressjs.com/), [Mockaroo](https://www.mockaroo.com/) (test data approach)
- FIT5032 Week 8 to 12 studios (Firestore, Cloud Functions, deployment)

## Roles and access

Two roles: `member` and `admin`. Every account created through `/register` is
a member, there is no admin option on the form. The one admin account was
added by hand in the Firebase console, and the Firestore rules block anyone
from writing `role: 'admin'` to their own profile.

| | Signed out | Member | Admin |
|---|---|---|---|
| `/dashboard` | redirected to `/login` | own dashboard | own dashboard |
| `/admin` | redirected to `/login` | redirected to `/access-denied` | admin console |
| Rate a route | prompted to log in | can rate | can rate |

Guarded in two places: `src/router/index.js` (`beforeEach`, user experience
only) and `firestore.rules` (the real server-side check, still enforced even
if someone edits the client code).

Test accounts:

- Admin: `admin@commongoal.org` / `[password removed]`
- Register your own member account through `/register`, or use the throwaway
  test account created while checking the XSS proof below

## Ratings

Doc id is `ratings/{uid}_{routeId}`, so a member has at most one rating per
route and re-rating overwrites it rather than adding a second row. Score is 1
to 5, comment is optional and capped at 300 characters. `src/stores/ratings.js`
holds one `onSnapshot` listener so the average and count on every route card,
and the admin table, update live as ratings come in, no page refresh needed.

## Security (BR C.4)

| Measure | Flaw it stops | Where |
|---|---|---|
| `sanitiseText()` strips `<` and `>` before writing | Stored XSS through the registration name or rating comment | `src/utils/security.js`, applied in `RegisterView.vue` and `src/stores/ratings.js` |
| No `v-html` anywhere in `src/` | Rendering user input as HTML, the other half of the XSS surface | whole app, checked with `grep -rn "v-html" src` |
| Password policy, 8+ characters with a letter and a number | Weak, easily guessed passwords | client-side in `RegisterView.vue`, and Firebase Auth itself rejects weak passwords server-side |
| One generic login error for every failure | Account enumeration, telling an attacker which emails are registered | `src/stores/auth.js` |
| Firebase config in gitignored `.env.local`, only `.env.example` committed | An API key sitting in source control history | `src/firebase/init.js` reads `import.meta.env.VITE_*` |
| Firestore rules, published in production mode | The Firebase API key is not a secret on its own, the rules are what actually stop an unauthorised read or write | `firestore.rules`, self-checked against three cases in the Rules Playground: unauthenticated write to `ratings`, a score of 6, and a `users` create with `role: 'admin'` |
| `maxlength` on the registration name (80) and rating comment (300) | Oversized input, matches the caps the Firestore rules also enforce | `RegisterView.vue`, `RouteRating.vue` |

**How to test:** register with the full name
`<img src=x onerror=alert(1)>` and post the rating comment
`<script>alert('xss')</script>`. Both are stripped to plain text before they
reach Firestore and render as literal text everywhere they are shown. No
alert dialog fires.

## Run locally

Needs a `.env.local` in this folder with your own Firebase project's config,
see `.env.example` for the variable names. The app will not start without it.

```sh
npm install
npm run dev
```

Build for production:

```sh
npm run build
```

## References

- Nav header adapted from the [Bootstrap Headers example](https://getbootstrap.com/docs/5.0/examples/headers/)
  and the [Bootstrap Navbar docs](https://getbootstrap.com/docs/5.0/components/navbar/),
  collapsible hamburger menu below 768px.
- Form validation pattern (blur and submit validation, `errors` ref object) and
  the PrimeVue `DataTable`/`Column` usage follow the class studio pattern from
  the FIT5032 Week 3-4 library registration exercise.
- Route guard pattern (`beforeEach`, `meta.requiresAuth`, `meta.roles`) follows
  the FIT5032 Week 6 lecture on Vue Router navigation guards.
- Firebase Auth and Firestore setup, and the `onAuthStateChanged` /
  `authReady` pattern, follow the FIT5032 Week 7 studio on Firebase
  authentication and access control.
- [Firebase Auth docs](https://firebase.google.com/docs/auth/web/start)
- [Firestore security rules docs](https://firebase.google.com/docs/firestore/security/get-started)
- [PrimeVue DataTable docs](https://primevue.org/datatable/)
- [Bootstrap docs](https://getbootstrap.com/docs/5.0/)

The "Invalid PrimeUI License" badge visible in the console and UI is the
expected PrimeVue community license watermark, not an application error.
