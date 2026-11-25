import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import '@fontsource-variable/inter'
import './assets/responsive.css'
import './assets/theme.css'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Same green as theme.css, so PrimeVue tables match the Bootstrap buttons.
const CommonGoalTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{emerald.50}',
      100: '{emerald.100}',
      200: '{emerald.200}',
      300: '{emerald.300}',
      400: '{emerald.400}',
      500: '{emerald.500}',
      600: '{emerald.600}',
      700: '{emerald.700}',
      800: '{emerald.800}',
      900: '{emerald.900}',
      950: '{emerald.950}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{emerald.700}',
          contrastColor: '#ffffff',
          hoverColor: '{emerald.800}',
          activeColor: '{emerald.900}',
        },
        highlight: {
          background: '{emerald.50}',
          focusBackground: '{emerald.100}',
          color: '{emerald.800}',
          focusColor: '{emerald.900}',
        },
      },
    },
  },
})

const app = createApp(App)

app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: CommonGoalTheme,
    // Always light. Otherwise PrimeVue follows Windows dark mode and the text is hard to read.
    options: { darkModeSelector: 'none' },
  },
  // Free student license key. Removes the red "Invalid PrimeUI License" badge.
  license: import.meta.env.VITE_PRIMEUI_LICENSE,
})

app.component('DataTable', DataTable)
app.component('Column', Column)

app.mount('#app')
