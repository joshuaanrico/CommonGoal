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
    // Always light. Otherwise PrimeVue follows Windows dark mode and the text is hard to read.
    options: { darkModeSelector: 'none' },
  },
  // Free student license key. Removes the red "Invalid PrimeUI License" badge.
  license: import.meta.env.VITE_PRIMEUI_LICENSE,
})

app.component('DataTable', DataTable)
app.component('Column', Column)

app.mount('#app')
