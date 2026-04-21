<script setup>
import Header from '@/components/Header.vue'
import {skin} from '@/skin.js'
</script>

<template>
    <Header />
  <main>
    <div id="sfondo">
      <RouterView />
    </div>
  </main>
</template>

<style>
  #sfondo{
  --bg-color: v-bind('skin.temaPrincipale');
  --bg-pattern: v-bind('skin.sfondoURL');
}
</style>