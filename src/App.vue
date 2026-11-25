<script setup>
import BHeader from './components/BHeader.vue'
import AppFooter from './components/AppFooter.vue'

// Move focus to the content (a normal #main link would only scroll).
const focusMain = () => document.getElementById('main')?.focus()
</script>

<template>
  <!-- Skip link: first thing you reach with Tab. Jumps past the menu (WCAG 2.4.1). -->
  <a href="#main" class="skip-link" @click.prevent="focusMain">Skip to main content</a>

  <BHeader />

  <!-- tabindex -1: code can focus it, but Tab skips it. -->
  <main id="main" tabindex="-1">
    <router-view></router-view>
  </main>

  <AppFooter />
</template>

<style scoped></style>
