import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/responsive.css'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    // The rest of the site (Bootstrap) is always light. Without this PrimeVue follows the
    // operating system dark mode, which gave dark tables and dialogs with unreadable text on
    // a light page. 'none' keeps every PrimeVue component light.
    options: { darkModeSelector: 'none' },
  },
  // PrimeUI Community License key (free for students). Checked offline in the browser, so it
  // is not a secret. Without it PrimeVue shows an "Invalid PrimeUI License" badge.
  license: import.meta.env.VITE_PRIMEUI_LICENSE,
})

app.component('DataTable', DataTable)
app.component('Column', Column)

app.mount('#app')
