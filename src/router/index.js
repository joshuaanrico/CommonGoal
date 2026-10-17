import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RoutesView from '../views/RoutesView.vue'
import JoinView from '../views/JoinView.vue'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import AccessDeniedView from '../views/AccessDeniedView.vue'
import AdminView from '../views/AdminView.vue'
import ClubsView from '../views/ClubsView.vue'
import EventsView from '../views/EventsView.vue'
import { authReady, isAuthenticated, userRole } from '../stores/auth'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/routes', name: 'Routes', component: RoutesView },
  { path: '/join', name: 'Join', component: JoinView },
  // Lazy loaded: Mapbox is large, so it only downloads when someone opens the map.
  { path: '/map', name: 'Map', component: () => import('../views/MapView.vue') },
  { path: '/share', name: 'Share', component: () => import('../views/ShareRouteView.vue'), meta: { requiresAuth: true } },
  { path: '/api-docs', name: 'API', component: () => import('../views/ApiDocsView.vue') },
  { path: '/clubs', name: 'Clubs', component: ClubsView },
  { path: '/events', name: 'Events', component: EventsView },
  { path: '/register', name: 'Register', component: RegisterView },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/dashboard', name: 'Dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/access-denied', name: 'AccessDenied', component: AccessDeniedView },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: { requiresAuth: true, roles: ['admin'] },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Wait for the first auth check, or a refresh on a protected page bounces to login.
router.beforeEach(async (to) => {
  await authReady

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'Login' }
  }

  if (to.meta.roles && !to.meta.roles.includes(userRole.value)) {
    return { name: 'AccessDenied' }
  }
})

// Single page apps do not reload, so screen readers get no signal that the page changed.
// After every navigation, set a unique title (WCAG 2.4.2) and move focus to the main area so
// the new page is announced and keyboard users start at the top of the content (WCAG 2.4.3).
router.afterEach((to) => {
  const name = to.name ? String(to.name) : 'CommonGoal'
  document.title = to.name === 'Home' ? 'CommonGoal' : `${name} | CommonGoal`

  nextTick(() => {
    const main = document.getElementById('main')
    if (main) main.focus({ preventScroll: true })
  })
})

export default router
