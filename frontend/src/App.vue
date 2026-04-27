<script setup>
import Header from '@/components/Header.vue'
import {skin} from '@/ambiente.js'
</script>

<template >
  <div id="ambiente">
    <Header />
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style>
  #ambiente {
  --bg-color: v-bind('skin.temaPrincipale');
  --bg-pattern: v-bind('skin.sfondoURL');
  --icona: v-bind('skin.icona');
}
</style>