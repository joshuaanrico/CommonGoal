import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RoutesView from '../views/RoutesView.vue'
import JoinView from '../views/JoinView.vue'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import AccessDeniedView from '../views/AccessDeniedView.vue'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/routes', name: 'Routes', component: RoutesView },
  { path: '/join', name: 'Join', component: JoinView },
  { path: '/register', name: 'Register', component: RegisterView },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/dashboard', name: 'Dashboard', component: DashboardView },
  { path: '/access-denied', name: 'AccessDenied', component: AccessDeniedView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
