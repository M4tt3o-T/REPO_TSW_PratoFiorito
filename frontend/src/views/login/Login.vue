<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { sessione } from '../../ambiente.js';

// Recupera l'indirizzo (locale o online) dal file .env
const API_URL = import.meta.env.VITE_SOCKET_URL;

const router=useRouter();

const VaiSignUp = () => {
  router.push("/signup")
};

const email=ref('');
const password=ref('');

const gestisciLogin = async () => {
  const response = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.value,
      password: password.value
    })
  });

  const dati = await response.json();
  if (dati.success) {
    sessione.setUtente(dati.user);
    router.push("/");
  } else {
    alert(dati.message);
  }
};

</script>

<style setup></style>

<template>
  <div id="main">
    <div id="finestraLogin" class="finestra">
      <form @submit.prevent="gestisciLogin">
        <div id="div_email">
          <label for="email">Email: </label> <br>
          <input v-model="email" type="email" id="email" required>
        </div>
        
        <div id="div_password">
          <label for="password">Password:</label><br> 
          <input v-model="password" type="password" id="password" name="password" required>
        </div>

        <div id="div_bottoni">
          <button @click="VaiSignUp">Non hai un account? Registrati</button>  
        
          <button type="submit">Accedi</button>
        </div>

        

      </form>
    </div>
  </div>
</template>

<style scoped>
  /* Il contenitore si adatta al telefono (90%) ma si ferma a 400px sui PC */
  #finestraLogin {
    margin: 10vh auto;
    width: 90%;
    max-width: 400px;
    background-color: var(--bg-color);
    padding: 30px;
    border-radius: 12px;
    box-sizing: border-box;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  }

  #div_email, #div_password {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
    font-size: 1.2rem;
    text-align: left;
  }

  /* L'input prende tutto lo spazio disponibile del contenitore */
  input {
    width: 100%;
    font-size: 1rem;
    padding: 12px;
    margin-top: 8px;
    box-sizing: border-box;
    border-radius: 6px;
    border: none;
  }

  /* Contenitore bottoni: colonna su mobile, riga su desktop */
  #div_bottoni {
    margin-top: 30px;
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

  /* Se lo schermo è più largo di 480px (es. tablet o PC), i bottoni si affiancano */
  @media (min-width: 480px) {
    #div_bottoni {
      flex-direction: row;
      justify-content: space-between;
    }
    button {
      width: 48%; /* Ogni bottone prende quasi metà spazio */
    }
  }
</style>