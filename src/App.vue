<script setup>
import BHeader from './components/BHeader.vue'

// A plain #main link would only scroll, so move focus to the landmark as well. Screen reader
// and keyboard users then continue reading from the content, not from the menu.
const focusMain = () => document.getElementById('main')?.focus()
</script>

<template>
  <!-- First stop for keyboard users: jump past the navigation straight to the page content (WCAG 2.4.1). -->
  <a href="#main" class="skip-link" @click.prevent="focusMain">Skip to main content</a>

  <BHeader />

  <!-- tabindex -1 lets the router move focus here after each page change without adding a tab stop. -->
  <main id="main" tabindex="-1">
    <router-view></router-view>
  </main>
</template>

<style scoped></style>
