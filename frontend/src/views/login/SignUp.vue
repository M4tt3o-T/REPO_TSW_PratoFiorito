<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { sessione } from '../../ambiente.js';

// Recupera l'indirizzo (locale o online) dal file .env
const API_URL = import.meta.env.VITE_SOCKET_URL;

const router = useRouter();

const VaiLogin = () => {
  router.push("/login");
};

// Definiamo i dati del form in modo reattivo
const username = ref('');
const email = ref('');
const password = ref('');
const confermaPassword = ref('');

const gestisciSignup = async () => {
  if (password.value !== confermaPassword.value) {
    alert("ERRORE: le password non combaciano");
    return false;
  }
  router.push("/");

  const response = await fetch(`${API_URL}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: username.value,
      email: email.value,
      password: password.value
    })
  });

  const dati = await response.json();
  if (dati.success) {
    sessione.setUtente(dati.user); // Salviamo l'utente loggato
    router.push("/");
  } else {
    alert(dati.message);
  }
};
</script>

<template>
  <div id="main">
    <div id="finestraSignup" class="finestra">
      <form @submit.prevent="gestisciSignup">

        <div id="div_username">
            <label for="username">Username:</label> <br>
            <input v-model="username" type="text" id="username" size="35" required>
        </div>

        <div id="div_email">
            <label for="email">Email:</label> <br>
            <input v-model="email" type="email" id="email" size="35" required>
        </div>
        
        <div id="div_password">
            <label for="password">Password:</label> <br>
            <input v-model="password" type="password" id="password" size="35" required>
        </div>
        
        <div id="div_confermaPassword">
            <label for="confermaPassword">Conferma Password:</label> <br>
            <input v-model="confermaPassword" id="confermaPassword" type="password" size="35" required>
        </div>
        
        <div id="div_bottoni">
            <button type="button" @click="VaiLogin">Hai già un account? Accedi</button>

            <button type="submit">Registrati</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
    #div_username,#div_email,#div_password,#div_confermaPassword,#div_bottoni{
        padding-top : 4%;
        padding-bottom: 4%;
        align-items: center;
        font-size: 1.1dvw;
    }
    #div_username,#div_email,#div_password,#div_confermaPassword{
        display: grid;
        justify-content:left;
    }
    #div_bottoni{
        margin-top: 3%;
        display: flex;
        justify-content:space-between;
    }
    input{
        margin-left:4%;
        font-size:20px;
    }
    button{
        padding:1%;
        font-size: 1dvw;
        cursor: pointer;
    }
    #finestraSignup {
        margin-top:4%;
        width :25dvw;
        height : 60dvh;
        background-color: var(--bg-color);
        padding : 1%;
        padding-left: 2%;
        padding-right : 2%;
    }
</style>