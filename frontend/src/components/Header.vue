<script setup>
  import { skin, sessione } from "../ambiente"
  import { useRouter } from 'vue-router';
  const router=useRouter();
  const TornaHome = () => {
    router.push('/')
  };
  const VaiLogin = () => {
    router.push("/login")
  };
  // Funzione per gestire il Logout
  const EseguiLogout = () => {
    sessione.logout(); // Svuota la variabile e il LocalStorage
    router.push("/");
  };
</script>

<template>
  <div id="main-header">
    <label @click="TornaHome" style="cursor: pointer;">MineSweeperMMO</label>
    
    <div v-if="sessione.utente" class="sezione-utente">
      <label style="font-size:30px; margin-right: 10px;">{{skin.icona}}</label> 
      
      <span class="nome-profilo">{{ sessione.utente.username }}</span> 
      
      <button @click="EseguiLogout">LOG OUT</button>
    </div>

    <div v-else>
      <button @click="VaiLogin">ACCEDI / REGISTRATI</button>
    </div>

  </div>
</template>

<style scoped>
  button {
    padding: 0.8rem 1.2rem;
    font-size: 16px;
    cursor: pointer;
    margin-left: 15px;
    border: none;
    border-radius: 5px;
    background-color: #333;
    color: white;
  }

  button:hover {
    background-color: #555;
  }

  #main-header{
    display: flex;
    justify-content: space-between;
    align-items:center;
    padding: 1% 2%;
    font-size: 2.5vh;
    background: linear-gradient(var(--bg-color),color-mix(in srgb, var(--bg-color), black 20%));
    transition: background-color 0.3s ease;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 900;
  }

  .nome-profilo {
  font-weight: bold;
  font-size: 1.2rem;
  color: #333;
}
</style>