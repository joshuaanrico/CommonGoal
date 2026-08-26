import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RoutesView from '../views/RoutesView.vue'
import JoinView from '../views/JoinView.vue'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/routes', name: 'Routes', component: RoutesView },
  { path: '/join', name: 'Join', component: JoinView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
