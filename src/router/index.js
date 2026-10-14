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

export default router
