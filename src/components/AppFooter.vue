<template>
  <footer class="site-footer">
    <div class="container">
      <div class="row g-4">
        <div class="col-md-6">
          <p class="footer-brand">CommonGoal</p>
          <p class="small mb-0">
            Climate-ready community sport for Melbourne's north. A student project built at Monash
            University. Clubs, routes and events are sample data.
          </p>
        </div>
        <div class="col-6 col-md-3">
          <h2 class="footer-title">Explore</h2>
          <ul class="list-unstyled small mb-0">
            <li><RouterLink to="/routes">Routes</RouterLink></li>
            <li><RouterLink to="/map">Map</RouterLink></li>
            <li><RouterLink to="/clubs">Clubs</RouterLink></li>
            <li><RouterLink to="/events">Events</RouterLink></li>
          </ul>
        </div>
        <div class="col-6 col-md-3">
          <h2 class="footer-title">Get involved</h2>
          <ul class="list-unstyled small mb-0">
            <li><RouterLink to="/join">Join</RouterLink></li>
            <li><RouterLink to="/register">Create an account</RouterLink></li>
            <li><RouterLink to="/api-docs">Public API</RouterLink></li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 2rem;
  padding: 3rem 0 3.5rem;
  background: var(--cg-green-950);
  color: #c9e4d6;
}

.footer-brand {
  color: #fff;
  font-weight: 800;
  font-size: 1.15rem;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}

.footer-title {
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

li + li {
  margin-top: 0.35rem;
}

a {
  color: #c9e4d6;
  text-decoration: none;
}

a:hover {
  color: #fff;
  text-decoration: underline;
}
</style>
