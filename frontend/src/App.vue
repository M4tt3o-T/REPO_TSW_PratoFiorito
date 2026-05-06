<script setup>
import Header from '@/components/Header.vue'
import { skin, notifica, toast, sessione } from '@/ambiente.js'
import { socket } from '@/socket.js'
import { onMounted } from 'vue'

onMounted(() => {
  // 1. Se c'è un utente loggato, accendiamo il Socket in tutto il sito
  if (sessione.utente) {
    socket.auth = { token: localStorage.getItem('token_campo_minato') };
    socket.connect();
  }

  // 2. Restiamo in ascolto se il server ci sblocca un obiettivo
  socket.on('obiettivo_sbloccato', (dati) => {
    toast.mostra(dati.titolo, dati.descrizione);
  });
});
</script>

<template >
  <div id="ambiente">
    <Header />
    <main>
      <RouterView />
    </main>

    <div v-if="notifica.visibile" class="modal-overlay-alert">
      <div class="modal-alert">
        <p>{{ notifica.messaggio }}</p>
        <button class="btn-ok" @click="notifica.chiudi()">OK</button>
      </div>
    </div>

    <div v-if="toast.visibile" class="toast-container">
      <div class="toast-content">
        <div class="toast-icona">🏆</div>
        <div class="toast-testo">
          <h4>{{ toast.titolo }}</h4>
          <p>{{ toast.descrizione }}</p>
        </div>
        <button class="toast-chiudi" @click="toast.chiudi()">X</button>
      </div>
    </div>

  </div>
</template>

<style>
  #ambiente {
  --bg-color: v-bind('skin.temaPrincipale');
  --bg-pattern: v-bind('skin.sfondoURL');
  --icona: v-bind('skin.icona');
}

.modal-overlay-alert {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* Sta sopra a qualsiasi altra cosa */
}

.modal-alert {
  background-color: #fff;
  color: #333;
  padding: 25px 30px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  min-width: 300px;
  max-width: 80%;
  animation: comparsa 0.2s ease-out;
}

.modal-alert p {
  font-size: 1.2rem;
  margin-bottom: 20px;
  font-weight: 500;
}

.modal-alert .btn-ok {
  background-color: var(--bg-color, #42b9af);
  color: white;
  border: none;
  padding: 10px 30px;
  font-size: 1.1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: filter 0.2s;
}

.modal-alert .btn-ok:hover {
  filter: brightness(0.9);
}

@keyframes comparsa {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.toast-container {
  position: fixed;
  top: 80px; /* Sotto l'header */
  right: 20px;
  z-index: 10000;
  animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-content {
  background: linear-gradient(135deg, #2c3e50, #1a252f);
  color: white;
  border-left: 5px solid #f1c40f;
  padding: 15px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.4);
  min-width: 250px;
  max-width: 350px;
}

.toast-icona {
  font-size: 2rem;
}

.toast-testo h4 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  color: #f1c40f;
}

.toast-testo p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.3;
}

.toast-chiudi {
  background: none;
  border: none;
  color: rgba(255,255,255,0.5);
  font-size: 1.2rem;
  cursor: pointer;
  margin-left: auto;
  align-self: flex-start;
}

.toast-chiudi:hover {
  color: white;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>