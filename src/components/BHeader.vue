<template>
  <!-- Using Bootstrap's Header template, adapted with RouterLink for active-state highlighting -->
  <!-- https://getbootstrap.com/docs/5.0/examples/headers/ -->
  <!-- Collapsible nav below 768px: https://getbootstrap.com/docs/5.0/components/navbar/ -->
  <nav class="navbar navbar-expand-md" aria-label="Main">
    <div class="container justify-content-center">
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNav"
        aria-controls="mainNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse flex-grow-0" id="mainNav">
        <ul class="nav nav-pills py-3 align-items-md-center">
          <li class="nav-item">
            <RouterLink to="/" class="nav-link" active-class="active" exact-active-class="active">Home</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/routes" class="nav-link" active-class="active">Routes</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/map" class="nav-link" active-class="active">Map</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/clubs" class="nav-link" active-class="active">Clubs</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/events" class="nav-link" active-class="active">Events</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/join" class="nav-link" active-class="active">Join</RouterLink>
          </li>

          <!-- Signed out: the two ways in -->
          <template v-if="!isAuthenticated">
            <li class="nav-item">
              <RouterLink to="/login" class="nav-link" active-class="active">Log in</RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink to="/register" class="nav-link" active-class="active">Register</RouterLink>
            </li>
          </template>

          <!-- Signed in: member links, plus Admin only when the profile says admin -->
          <template v-else>
            <li class="nav-item">
              <RouterLink to="/share" class="nav-link" active-class="active">Share</RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink to="/dashboard" class="nav-link" active-class="active">Dashboard</RouterLink>
            </li>
            <li class="nav-item" v-if="isAdmin">
              <RouterLink to="/admin" class="nav-link" active-class="active">Admin</RouterLink>
            </li>
            <li class="nav-item">
              <span class="nav-link disabled text-body-secondary">{{ currentUser.email }}</span>
            </li>
            <li class="nav-item">
              <button type="button" class="btn btn-outline-secondary btn-sm ms-md-2" @click="handleLogout">
                Log out
              </button>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { currentUser, isAuthenticated, isAdmin, logout } from '../stores/auth'

const router = useRouter()

// Hiding the Admin link is convenience only. The route guard in the router is what
// actually stops a member reaching /admin by typing the URL.
const handleLogout = async () => {
  try {
    await logout()
    router.push('/')
  } catch (error) {
    console.error('Logout failed:', error.code)
  }
}
</script>
