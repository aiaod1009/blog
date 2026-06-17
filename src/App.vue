<script setup lang="ts">
import SiteFooter from './components/SiteFooter.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <router-view class="flex-1" />
    <SiteFooter />
  </div>
</template>
