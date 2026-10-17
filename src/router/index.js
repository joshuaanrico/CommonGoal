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

// meta.title is shown in the browser tab.
const routes = [
  { path: '/', name: 'Home', component: HomeView, meta: { title: 'Home' } },
  { path: '/routes', name: 'Routes', component: RoutesView, meta: { title: 'Routes' } },
  { path: '/join', name: 'Join', component: JoinView, meta: { title: 'Join' } },
  // Lazy loaded: the page code only downloads when someone opens it (Mapbox is big).
  { path: '/map', name: 'Map', component: () => import('../views/MapView.vue'), meta: { title: 'Map' } },
  {
    path: '/share',
    name: 'Share',
    component: () => import('../views/ShareRouteView.vue'),
    meta: { title: 'Share a route', requiresAuth: true },
  },
  { path: '/api-docs', name: 'API', component: () => import('../views/ApiDocsView.vue'), meta: { title: 'API' } },
  { path: '/clubs', name: 'Clubs', component: ClubsView, meta: { title: 'Clubs' } },
  { path: '/events', name: 'Events', component: EventsView, meta: { title: 'Events' } },
  { path: '/register', name: 'Register', component: RegisterView, meta: { title: 'Register' } },
  { path: '/login', name: 'Login', component: LoginView, meta: { title: 'Log in' } },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { title: 'Dashboard', requiresAuth: true },
  },
  { path: '/access-denied', name: 'AccessDenied', component: AccessDeniedView, meta: { title: 'Access denied' } },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: { title: 'Admin', requiresAuth: true, roles: ['admin'] },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // New page starts at the top. Back button goes back to where you were.
  scrollBehavior: (to, from, savedPosition) => savedPosition || { top: 0 },
})

// Wait for Firebase to restore the login first, then check access.
router.beforeEach(async (to) => {
  await authReady

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    // Remember the page, so login can send the user back to it.
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  if (to.meta.roles && !to.meta.roles.includes(userRole.value)) {
    return { name: 'AccessDenied' }
  }
})

// A single page app never reloads, so screen readers don't notice a new page.
// After each page change: set the tab title and move focus to the main content (WCAG 2.4.2, 2.4.3).
router.afterEach((to) => {
  document.title = to.name === 'Home' ? 'CommonGoal' : `${to.meta.title ?? 'CommonGoal'} | CommonGoal`

  nextTick(() => {
    document.getElementById('main')?.focus({ preventScroll: true })
  })
})

export default router
