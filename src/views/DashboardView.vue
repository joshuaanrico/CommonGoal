<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <h1>Welcome, {{ userProfile?.fullName }}</h1>
        <p class="text-body-secondary">Signed in as {{ currentUser?.email }}, role: {{ userRole }}</p>

        <div class="card mt-4" v-if="isAdmin">
          <div class="card-body">
            <h2 class="h5">Admin panel</h2>
            <p class="card-text">
              You have admin access. Visit the <RouterLink to="/admin">Admin console</RouterLink>
              to review registered users and route rating aggregates.
            </p>
          </div>
        </div>

        <div class="card mt-4" v-else>
          <div class="card-body">
            <h2 class="h5">Member panel</h2>
            <p class="card-text">
              Browse <RouterLink to="/routes">Routes</RouterLink> and rate the ones you have
              tried. Your ratings help other members pick a route.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { currentUser, userProfile, userRole, isAdmin } from '../stores/auth'
</script>
