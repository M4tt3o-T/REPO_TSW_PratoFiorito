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
          <input v-model="email" type="email" id="email" size="35" required>
        </div>
        
        <div id="div_password">
          <label for="password">Password:</label><br> 
          <input v-model="password" type="password" id="password" name="password" size="35" required>
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
  #div_email,#div_password,#div_bottoni{
    padding-top : 6%;
    padding-bottom: 6%;
    align-items: center;
    font-size: 1.1dvw;
  }
  #div_email,#div_password{
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
  #finestraLogin{
    margin-top:5%;
    width :25dvw;
    height : 40dvh;
    background-color: var(--bg-color);
    padding : 1%;
    padding-left: 2%;
    padding-right : 2%;
  }
</style>