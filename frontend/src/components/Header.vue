<script setup>
  import {skin} from "../ambiente"
  import { useRouter } from 'vue-router';
  const router=useRouter();
  const TornaHome = () => {
    router.push('/')
  };
</script>

<template>
  <div id="main-header">
    <label @click="TornaHome">MineSweeperMMO</label>
    <div>
      var(--icona) Nome profilo
      <button>LOG OUT</button>
    </div>
  </div>
</template>

<style scoped>
button{
  padding:1rem;
  font-size:18px
}
  #main-header{
    display: flex;
    justify-content: space-between;
    align-items:center;
    padding:1%;
    font-size: 2.5vh;
    background-color: v-bind('skin.temaPrincipale');
    transition: background-color 0.3s ease;
  }
</style>