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
            <input v-model="username" type="text" id="username" required>
        </div>

        <div id="div_email">
            <label for="email">Email:</label> <br>
            <input v-model="email" type="email" id="email" required>
        </div>
        
        <div id="div_password">
            <label for="password">Password:</label> <br>
            <input v-model="password" type="password" id="password" required>
        </div>
        
        <div id="div_confermaPassword">
            <label for="confermaPassword">Conferma Password:</label> <br>
            <input v-model="confermaPassword" id="confermaPassword" type="password" required>
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
  #finestraSignup {
    margin: 5vh auto;
    width: 90%;
    max-width: 450px;
    background-color: var(--bg-color);
    padding: 30px;
    border-radius: 12px;
    box-sizing: border-box;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  }

  #div_username, #div_email, #div_password, #div_confermaPassword {
    display: flex;
    flex-direction: column;
    margin-bottom: 15px;
    font-size: 1.2rem;
    text-align: left;
  }

  input {
    width: 100%;
    font-size: 1rem;
    padding: 10px;
    margin-top: 5px;
    box-sizing: border-box;
    border-radius: 6px;
    border: none;
  }

  #div_bottoni {
    margin-top: 25px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  button {
    padding: 12px;
    font-size: 1rem;
    cursor: pointer;
    border-radius: 6px;
    border: none;
    width: 100%;
    transition: background-color 0.2s;
  }

  button:hover {
    filter: brightness(0.9);
  }

  @media (min-width: 480px) {
    #div_bottoni {
      flex-direction: row;
      justify-content: space-between;
    }
    button {
      width: 48%;
    }
  }
</style>