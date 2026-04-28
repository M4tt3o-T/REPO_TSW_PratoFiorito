<script setup>
  import {skin} from "../ambiente"
  import { useRouter } from 'vue-router';
  const router=useRouter();
  const TornaHome = () => {
    router.push('/')
  };
  const VaiLogin = () => {
    router.push("/login")
  };
</script>

<template>
  <div id="main-header">
    <label @click="TornaHome">MineSweeperMMO</label>
    <div>
      <label style="font-size:30px;">{{skin.icona}}</label> Nome profilo
      <button @click="VaiLogin">LOG OUT</button>
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
    background-color: var(--bg-color);
    transition: background-color 0.3s ease;
  }
</style>