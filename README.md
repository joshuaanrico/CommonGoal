# CommonGoal

A1.2 (V1) and A1.3 (V2) Basic Application Development for FIT5032. Vue 3, Vue
Router, Bootstrap 5, PrimeVue, Firebase Auth, Firestore.

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
