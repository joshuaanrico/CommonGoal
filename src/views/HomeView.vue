<template>
  <div class="container mt-5">
    <!-- Hero -->
    <div class="row align-items-center mb-5">
      <div class="col-lg-8">
        <h1>CommonGoal</h1>
        <p class="lead">
          Helping Melbourne community sports clubs go climate-ready and make active
          travel — walking, riding, scooting — the default way families reach
          training, games and school.
        </p>
        <RouterLink to="/routes" class="btn btn-primary me-2">Find a route</RouterLink>
        <RouterLink to="/join" class="btn btn-outline-primary">Join CommonGoal</RouterLink>
      </div>
    </div>

    <!-- Audience cards -->
    <div class="row mb-5">
      <div class="col-lg-4 col-md-6 col-12 mb-4" v-for="audience in audiences" :key="audience.title">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">{{ audience.title }}</h5>
            <p class="card-text">{{ audience.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Impact numbers -->
    <div class="row text-center mb-5">
      <div class="col-lg-3 col-md-6 col-12 mb-4" v-for="stat in impactStats" :key="stat.label">
        <h2 class="text-primary">{{ stat.value }}</h2>
        <p class="text-muted">{{ stat.label }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const audiences = [
  {
    title: 'Participants and families',
    description:
      'Find shaded, step-free routes near your club and see which sessions you can walk or ride to.',
  },
  {
    title: 'Volunteer club coordinators',
    description:
      'Sign your club up for the climate-ready accreditation pathway without adding to your after-hours workload.',
  },
  {
    title: 'Staff and funders',
    description:
      'Track participation and emissions-avoided figures that support grant reporting.',
  },
]

const impactStats = [
  { value: '12', label: 'Clubs onboarded' },
  { value: '340', label: 'Active families' },
  { value: '8', label: 'Active travel routes mapped' },
  { value: '2.1t', label: 'CO2 avoided this season' },
]
</script>
