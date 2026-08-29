<template>
  <!-- Using Bootstrap's Header template, adapted with RouterLink for active-state highlighting -->
  <!-- https://getbootstrap.com/docs/5.0/examples/headers/ -->
  <!-- Collapsible nav below 768px: https://getbootstrap.com/docs/5.0/components/navbar/ -->
  <nav class="navbar navbar-expand-md">
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
        <ul class="nav nav-pills py-3">
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
      </div>
    </div>
  </nav>
</template>

<script setup></script>
