<template>
  <!-- Using Bootstrap's Header template, adapted with RouterLink for active-state highlighting -->
  <!-- https://getbootstrap.com/docs/5.0/examples/headers/ -->
  <div class="container">
    <header class="d-flex justify-content-center py-3">
      <ul class="nav nav-pills">
        <li class="nav-item">
          <RouterLink to="/" class="nav-link" active-class="active" exact-active-class="active">Home</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink to="/routes" class="nav-link" active-class="active">Routes</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink to="/join" class="nav-link" active-class="active">Join</RouterLink>
        </li>
      </ul>
    </header>
  </div>
</template>

<script setup></script>
