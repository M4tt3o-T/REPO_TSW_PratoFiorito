<script setup>
  import {skin} from "../skin.js";
</script>

<template>
  <div id="main">
    <div id="menu">
      <button>Gioca</button>
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
    width:42dvw;
    height:75dvh;
    background-color: v-bind("skin.temaPrincipale");
  }
  button{
    font-size:2rem;
    padding-bottom:1rem;
    padding-top:1rem;
    margin:2.4rem;
    margin-left:10%;
    margin-right:10%;
  }
</style>