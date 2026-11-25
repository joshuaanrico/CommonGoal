<template>
  <div>
    <!-- Hero -->
    <section class="hero">
      <div class="container">
        <div class="row align-items-center g-5">
          <div class="col-lg-7">
            <p class="eyebrow">Climate-ready community sport</p>
            <h1>Walk, ride or scoot to sport.</h1>
            <p class="lead">
              CommonGoal helps Melbourne community sports clubs go climate-ready and make active
              travel the default way families reach training, games and school.
            </p>
            <div class="d-flex flex-wrap gap-2">
              <RouterLink to="/routes" class="btn btn-primary btn-lg">Find a route</RouterLink>
              <RouterLink to="/join" class="btn btn-outline-primary btn-lg">Join CommonGoal</RouterLink>
            </div>
          </div>

          <!-- Decorative preview of a route card. Screen readers skip it. -->
          <div class="col-lg-5 d-none d-lg-block" aria-hidden="true">
            <div class="preview">
              <svg class="preview-map" viewBox="0 0 320 170" role="presentation" focusable="false">
                <rect width="320" height="170" rx="14" fill="#e3efe8" />
                <path d="M0 120 C60 100 90 140 160 110 S260 60 320 80" stroke="#cfe0d6" stroke-width="16" fill="none" />
                <path d="M40 40 h70 v40 h-70z M200 30 h60 v35 h-60z M210 110 h70 v40 h-70z" fill="#d4e6db" />
                <path
                  d="M36 136 C70 120 90 70 140 78 S210 128 250 96 S286 44 292 38"
                  stroke="#047857"
                  stroke-width="5"
                  stroke-linecap="round"
                  stroke-dasharray="2 11"
                  fill="none"
                />
                <circle cx="36" cy="136" r="8" fill="#fff" stroke="#047857" stroke-width="4" />
                <circle cx="292" cy="38" r="9" fill="#047857" />
              </svg>
              <div class="preview-body">
                <p class="preview-title">Greenvale Reservoir Loop</p>
                <p class="preview-sub">Greenvale, sealed path</p>
                <ul class="chips">
                  <li class="chip-yes">Shaded</li>
                  <li class="chip-yes">Step-free</li>
                  <li>4.2 km</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Impact numbers -->
    <section class="container stats-wrap" aria-labelledby="impact-heading">
      <h2 id="impact-heading" class="visually-hidden">Pilot season so far</h2>
      <div class="stats">
        <div class="stat" v-for="stat in impactStats" :key="stat.label">
          <p class="stat-value">{{ stat.value }}</p>
          <p class="stat-label">{{ stat.label }}</p>
        </div>
      </div>
      <p class="small text-body-secondary text-center mt-2 mb-0">Pilot season figures (sample data).</p>
    </section>

    <!-- Audience cards -->
    <section class="container section" aria-labelledby="who-heading">
      <h2 id="who-heading" class="section-title">Who it's for</h2>
      <div class="row g-4">
        <div class="col-lg-4 col-md-6 col-12" v-for="audience in audiences" :key="audience.title">
          <div class="card h-100 audience">
            <div class="card-body">
              <span class="icon" aria-hidden="true" v-html="audience.icon"></span>
              <h3 class="h5 card-title">{{ audience.title }}</h3>
              <p class="card-text text-body-secondary">{{ audience.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Where to go next -->
    <section class="container section" aria-labelledby="explore-heading">
      <h2 id="explore-heading" class="section-title">Explore</h2>
      <div class="row g-3">
        <div class="col-md-6 col-lg-3" v-for="item in explore" :key="item.to">
          <RouterLink :to="item.to" class="explore-card">
            <span class="explore-title">{{ item.title }} <span aria-hidden="true">&rarr;</span></span>
            <span class="explore-text">{{ item.text }}</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Call to action -->
    <section class="container section">
      <div class="cta">
        <div>
          <h2 class="h3 mb-1">Is your club ready for a hotter season?</h2>
          <p class="mb-0">Sign up for the climate-ready pathway. It takes two minutes.</p>
        </div>
        <RouterLink to="/join" class="btn btn-light btn-lg">Join CommonGoal</RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup>
const ICON = {
  family:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 20c0-2 1-4 3-4s3 2 3 4"/></svg>',
  clipboard:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12l2 2 4-4"/></svg>',
  chart:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
}

const audiences = [
  {
    title: 'Participants and families',
    icon: ICON.family,
    description:
      'Find shaded, step-free routes near your club and see which sessions you can walk or ride to.',
  },
  {
    title: 'Volunteer club coordinators',
    icon: ICON.clipboard,
    description:
      'Sign your club up for the climate-ready accreditation pathway without adding to your after-hours workload.',
  },
  {
    title: 'Staff and funders',
    icon: ICON.chart,
    description: 'Track participation and emissions-avoided figures that support grant reporting.',
  },
]

const impactStats = [
  { value: '12', label: 'Clubs onboarded' },
  { value: '340', label: 'Active families' },
  { value: '8', label: 'Active travel routes mapped' },
  { value: '2.1t', label: 'CO2 avoided this season' },
]

const explore = [
  { to: '/routes', title: 'Routes', text: 'Walking and riding routes near your club, with shade and step-free info.' },
  { to: '/map', title: 'Map', text: 'Every route on one map, with directions from where you are.' },
  { to: '/clubs', title: 'Clubs', text: 'Partner clubs and how far along the climate-ready program they are.' },
  { to: '/events', title: 'Events', text: 'Walk to the game days, bike buses, workshops and tree plantings.' },
]
</script>

<style scoped>
.hero {
  padding: 4.5rem 0 5.5rem;
  background:
    radial-gradient(60rem 30rem at 85% -10%, rgba(16, 185, 129, 0.18), transparent 60%),
    radial-gradient(40rem 24rem at -10% 110%, rgba(4, 120, 87, 0.12), transparent 60%),
    linear-gradient(180deg, #eef7f2 0%, var(--cg-bg) 100%);
  border-bottom: 1px solid var(--cg-border);
}

.eyebrow {
  display: inline-block;
  margin-bottom: 1rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: #fff;
  border: 1px solid var(--cg-green-200);
  color: var(--cg-green-800);
  font-weight: 650;
  font-size: 0.85rem;
}

.hero h1 {
  font-size: clamp(2.4rem, 1.6rem + 3.4vw, 4rem);
  line-height: 1.05;
  margin-bottom: 1.25rem;
}

.hero .lead {
  color: var(--cg-muted);
  font-size: 1.2rem;
  max-width: 36rem;
  margin-bottom: 2rem;
}

.preview {
  background: #fff;
  border: 1px solid var(--cg-border);
  border-radius: var(--cg-radius-lg);
  box-shadow: var(--cg-shadow-lg);
  padding: 0.75rem;
  transform: rotate(1.5deg);
}

.preview-map {
  display: block;
  width: 100%;
  height: auto;
}

.preview-body {
  padding: 1rem 0.5rem 0.4rem;
}

.preview-title {
  font-weight: 700;
  margin: 0;
}

.preview-sub {
  color: var(--cg-muted);
  font-size: 0.9rem;
  margin: 0 0 0.75rem;
}

.stats-wrap {
  margin-top: -2.75rem;
  position: relative;
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  background: #fff;
  border: 1px solid var(--cg-border);
  border-radius: var(--cg-radius-lg);
  box-shadow: var(--cg-shadow-lg);
  overflow: hidden;
}

@media (min-width: 768px) {
  .stats {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat {
  padding: 1.5rem 1rem;
  text-align: center;
  border-right: 1px solid var(--cg-border);
  border-bottom: 1px solid var(--cg-border);
}

.stat-value {
  margin: 0;
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--cg-green-700);
}

.stat-label {
  margin: 0;
  color: var(--cg-muted);
  font-size: 0.9rem;
}

.section {
  padding-top: 4rem;
}

.section-title {
  font-size: 1.6rem;
  margin-bottom: 1.25rem;
}

.audience .icon {
  display: inline-grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  margin-bottom: 1rem;
  border-radius: 0.75rem;
  background: var(--cg-green-50);
  color: var(--cg-green-700);
}

.explore-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  height: 100%;
  padding: 1.25rem 1.35rem;
  background: #fff;
  border: 1px solid var(--cg-border);
  border-radius: var(--cg-radius);
  color: var(--cg-ink);
  text-decoration: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    transform 0.15s;
}

.explore-card:hover {
  border-color: var(--cg-green-600);
  box-shadow: var(--cg-shadow);
  transform: translateY(-2px);
}

.explore-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--cg-green-800);
}

.explore-text {
  color: var(--cg-muted);
  font-size: 0.925rem;
}

.cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 2.25rem 2.5rem;
  border-radius: var(--cg-radius-lg);
  background: linear-gradient(120deg, var(--cg-green-800), var(--cg-green-900));
  color: #d7efe3;
}

.cta h2 {
  color: #fff;
}

.cta .btn-light {
  color: var(--cg-green-900);
  font-weight: 700;
}
</style>
