<template>
  <!-- Bootstrap navbar, collapses into a menu button under 992px.
       https://getbootstrap.com/docs/5.3/components/navbar/ -->
  <header class="site-header">
    <nav class="navbar navbar-expand-lg" aria-label="Main">
      <div class="container">
        <RouterLink to="/" class="brand" aria-label="CommonGoal home">
          <svg class="brand-mark" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">
            <circle cx="16" cy="16" r="15" fill="#047857" />
            <path d="M9 19c5-1 8-4 10-10 2 6 1 12-5 14-2 .7-4 .3-5-1" fill="#d1fae5" />
            <path d="M10 22c3-3 6-5 9-6" stroke="#047857" stroke-width="1.6" fill="none" stroke-linecap="round" />
          </svg>
          <span>CommonGoal</span>
        </RouterLink>

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

        <div class="collapse navbar-collapse" id="mainNav">
          <ul class="navbar-nav main-links me-auto">
            <li class="nav-item" v-for="link in links" :key="link.to">
              <RouterLink :to="link.to" class="nav-link" active-class="active" :exact-active-class="link.exact ? 'active' : ''">
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>

          <!-- Signed out: the two ways in -->
          <ul class="navbar-nav account" v-if="!isAuthenticated">
            <li class="nav-item">
              <RouterLink to="/login" class="nav-link" active-class="active">Log in</RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink to="/register" class="btn btn-primary btn-sm">Register</RouterLink>
            </li>
          </ul>

          <!-- Signed in: member links, plus Admin only when the profile says admin -->
          <ul class="navbar-nav account" v-else>
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
              <span class="user-chip" :title="currentUser.email">
                <span class="avatar" aria-hidden="true">{{ initial }}</span>
                <span class="visually-hidden">Signed in as </span>
                <span class="email">{{ currentUser.email }}</span>
              </span>
            </li>
            <li class="nav-item">
              <button type="button" class="btn btn-outline-secondary btn-sm" @click="handleLogout">Log out</button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, isAuthenticated, isAdmin, logout } from '../stores/auth'

const router = useRouter()

const links = [
  { to: '/', label: 'Home', exact: true },
  { to: '/routes', label: 'Routes' },
  { to: '/map', label: 'Map' },
  { to: '/clubs', label: 'Clubs' },
  { to: '/events', label: 'Events' },
  { to: '/join', label: 'Join' },
  { to: '/api-docs', label: 'API' },
]

const initial = computed(() => (currentUser.value?.email?.[0] ?? '?').toUpperCase())

// Hiding the Admin link is only for looks. The router guard really blocks /admin.
const handleLogout = async () => {
  try {
    await logout()
    router.push('/')
  } catch (error) {
    console.error('Logout failed:', error.code)
  }
}
</script>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 1030;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: saturate(1.4) blur(10px);
  border-bottom: 1px solid var(--cg-border);
}

.navbar {
  padding-top: 0.6rem;
  padding-bottom: 0.6rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin-right: 1.75rem;
  color: var(--cg-ink);
  font-weight: 800;
  font-size: 1.15rem;
  letter-spacing: -0.02em;
  text-decoration: none;
}

.brand:hover {
  color: var(--cg-green-800);
}

.navbar-toggler {
  border-color: var(--cg-border-strong);
}

.nav-link {
  color: var(--cg-muted);
  font-weight: 550;
  font-size: 0.95rem;
  padding: 0.45rem 0.8rem !important;
  border-radius: 0.5rem;
}

.nav-link:hover {
  color: var(--cg-ink);
  background: #eef4f0;
}

.nav-link.active {
  color: var(--cg-green-800);
  background: var(--cg-green-50);
}

.main-links {
  gap: 0.15rem;
}

.account {
  gap: 0.35rem;
}

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.25rem 0.65rem 0.25rem 0.25rem;
  border: 1px solid var(--cg-border);
  border-radius: 999px;
  font-size: 0.85rem;
  color: var(--cg-muted);
  max-width: 15rem;
}

.user-chip .email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.avatar {
  display: inline-grid;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  background: var(--cg-green-700);
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
}

@media (min-width: 992px) {
  .account {
    align-items: center;
  }
}

@media (max-width: 991.98px) {
  .navbar-collapse {
    padding: 0.75rem 0 0.5rem;
  }

  .account {
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--cg-border);
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
}
</style>
