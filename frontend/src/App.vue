<script setup>
import Header from '@/components/Header.vue'
import {skin} from '@/ambiente.js'
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
  --icona: v-bind('skin.icona');
  height:100%;
  width:100%;
  min-height: 100%;
}
</style>