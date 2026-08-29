# CommonGoal

A1.2 Basic Application Development (V1) for FIT5032. Vue 3, Vue Router,
Bootstrap 5, PrimeVue.

CommonGoal is a fictional Melbourne not-for-profit that helps community sports
clubs go climate-ready and makes active travel (walking, riding, scooting) the
default way families reach training, games and school. Based in Greenvale VIC
3059.

## Pages and Business Requirements

| Page | Route | Demonstrates |
|---|---|---|
| Home | `/` | **BR A.2**, responsive hero, audience cards and impact stats across all breakpoints |
| Routes | `/routes` | **BR B.2**, local `routes.json` data rendered with `v-for`, live search and shade filter via `computed` |
| Join | `/join` | **BR B.1**, form with required field, email format and number range validation, submissions listed in a PrimeVue DataTable |

**BR A.1** (framework, structure, routing) applies across the whole app: Vue 3
Composition API, Vue Router, and components split under `src/components/` and
`src/views/`.

## Run locally

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
- [PrimeVue DataTable docs](https://primevue.org/datatable/)
- [Bootstrap docs](https://getbootstrap.com/docs/5.0/)

The "Invalid PrimeUI License" badge visible in the console and UI is the
expected PrimeVue community license watermark, not an application error.
