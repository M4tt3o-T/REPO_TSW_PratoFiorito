<script setup>
  import {skin} from "../skin"
</script>

<template>
  <div id="main-header">
    MineSweepMMO
    <div>
      ICONA Nome profilo
      <button>LOG OUT</button>
    </div>
  </div>
</template>

<style scoped>
button{
  padding:1.5rem;
  font-size:1.5rem
}
  #main-header{
    display: flex;
    justify-content: space-between;
    align-items:center;
    padding:2.5vh;
    font-size: 2.5vh;
    background-color: v-bind('skin.temaPrincipale');
    transition: background-color 0.3s ease;
  }
</style>