<script setup>
  import {skin} from "../ambiente.js";
  import { useRouter } from 'vue-router';
  const router = useRouter();

  const VaiPartita=()=>{
    router.push("/partita")
  }
</script>

<template>
  <div id="main">
    <div id="menu">
      <button @click="VaiPartita">Gioca</button>
      <button>Inventario</button>
      <button>Shop</button>
      <button>Obiettivi</button>
      <button>Classifica</button>
    </div>
  </div>
</template>

<style scoped>
  #menu{
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-top:4rem;
    width:48%;
    height:70%;
    background-color: v-bind("skin.temaPrincipale");
  }
  button{
    font-size:2rem;
    padding-bottom:1%;
    padding-top:1%;
    margin:1.7rem;
    margin-left:10%;
    margin-right:10%;
  }
</style>