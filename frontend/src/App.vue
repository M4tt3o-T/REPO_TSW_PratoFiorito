<script setup>
import Header from '@/components/Header.vue'
import { skin, notifica, toast, sessione, sfx } from '@/ambiente.js'
import { socket } from '@/socket.js'
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

//Per il feed
const feedAperto = ref(false)
const annunci = ref([])
const notificheFeed = ref(0)

const apriFeed = () => {
  feedAperto.value = !feedAperto.value
  notificheFeed.value = 0 // Azzera le notifiche quando apri
}

const AccettaInvito = (idStanza) => {
  feedAperto.value = false // Chiudiamo la tendina
  router.push({ path: '/partita/' + idStanza, query: { azione: 'unisciti' } })
}

onMounted(() => {
  // Se c'è un utente loggato, accendiamo il Socket in tutto il sito
  if (sessione.utente) {
    socket.auth = { token: localStorage.getItem('token_campo_minato') }
    socket.connect()
    socket.emit('richiedi_annunci') //Chiede gli annunci passati
  }

  // Ascoltiamo se il server ci rifiuta la connessione per token scaduti
  socket.on('connect_error', (errore) => {
    if (errore.message === 'Token non valido' || errore.message === 'Autenticazione richiesta') {
      sessione.logout()
      notifica.mostra("Sessione scaduta. Effettua nuovamente l'accesso per continuare.")
      if (router.currentRoute.value.path !== '/') {
        router.push('/') // Riportiamo l'utente alla home se si trovava in un'altra pagina
      }
    }
  })

  //Ricezione dello storico al login
  socket.on('storico_annunci', (dati) => {
    annunci.value = dati
  })

  //Ricezione di un annuncio in diretta
  socket.on('nuovo_annuncio_global', (annuncio) => {
    annunci.value.unshift(annuncio)
    if (!feedAperto.value) notificheFeed.value++
    if (annunci.value.length > 30) annunci.value.pop()

    // Gestione specifica per fine partita
    if (annuncio.tipo_evento === 'fine_partita') {
      sfx.play('richiesta.wav')
      const testo = annuncio.messaggio.split('|')[1]
      toast.mostra('Risultati Disponibili! 📊', testo, 'fine_partita')
    }
    // Gestione inviti
    else if (annuncio.tipo_evento === 'invito_partita') {
      sfx.play('richiesta.wav')
      const testo = annuncio.messaggio.split('|')[1]
      toast.mostra('Invito a giocare! 🎮', testo, 'invito')
    }
  })

  // Restiamo in ascolto se il server ci sblocca un obiettivo
  socket.on('obiettivo_sbloccato', (dati) => {
    // Facciamo partire il suono
    sfx.play('obiettivo.wav')

    // Mostriamo il popup a schermo
    toast.mostra(dati.titolo, dati.descrizione)
  })

  // Notifica in tempo reale per le richieste di amicizia
  socket.on('nuova_richiesta_amicizia', (dati) => {
    sfx.play('richiesta.wav')
    toast.mostra(
      'Nuova Richiesta! 🤝',
      `${dati.mittente} vuole essere tuo amico! Vai al profilo per accettare.`,
      'amicizia',
    )
  })

  document.addEventListener('click', (evento) => {
    // Se l'elemento cliccato (o il suo contenitore) è un bottone, fai click
    if (evento.target.closest('button')) {
      sfx.play('click.wav')
    }
  })
})

//Se l'utente fa login senza ricaricare la pagina, ricarichiamo il feed
watch(
  () => sessione.utente,
  (nuovoUtente) => {
    if (nuovoUtente) {
      socket.emit('richiedi_annunci')
    } else {
      annunci.value = []
    }
  },
)
</script>

<template>
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

    <div v-if="toast.visibile" class="toast-container" :class="'toast-' + toast.tipo">
      <div class="toast-content">
        <div class="toast-icona">
          {{ toast.tipo === 'amicizia' ? '👤' : toast.tipo === 'invito' ? '🚀' : '🏆' }}
        </div>

        <div class="toast-testo">
          <h4>{{ toast.titolo }}</h4>
          <p>{{ toast.descrizione }}</p>
        </div>
        <button class="toast-chiudi" @click="toast.chiudi()">X</button>
      </div>
    </div>

    <div v-if="sessione.utente">
      <button id="btn-feed" @click="apriFeed">
        📢 Annunci
        <span v-if="notificheFeed > 0" class="badge-notifica">{{ notificheFeed }}</span>
      </button>

      <div id="sidebar-feed" :class="{ aperta: feedAperto }">
        <div class="header-feed">
          <h3>Feed Globale</h3>
          <button class="btn-chiudi-feed" @click="feedAperto = false">X</button>
        </div>

        <div class="area-annunci">
          <div
            v-for="annuncio in annunci"
            :key="annuncio.id_evento"
            class="annuncio-card"
            :class="annuncio.tipo_evento"
          >
            <small class="ora">{{
              new Date(annuncio.creato_il).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            }}</small>
            <span class="tipo-badge">{{
              annuncio.tipo_evento.replace('_', ' ').toUpperCase()
            }}</span>
            <template v-if="annuncio.tipo_evento === 'fine_partita'">
              <p>{{ annuncio.messaggio.split('|')[1] }}</p>
              <button
                class="btn-visualizza-risultati"
                @click="AccettaInvito(annuncio.messaggio.split('|')[0])"
              >
                Visualizza Risultati 📈
              </button>
            </template>

            <template v-else-if="annuncio.tipo_evento === 'invito_partita'">
              <p>{{ annuncio.messaggio.split('|')[1] }}</p>
              <button
                class="btn-entra-invito"
                @click="AccettaInvito(annuncio.messaggio.split('|')[0])"
              >
                Entra nella Partita 🚀
              </button>
            </template>
            <template v-else>
              <p>{{ annuncio.messaggio }}</p>
            </template>
          </div>
          <div v-if="annunci.length === 0" class="vuoto">Nessun annuncio recente.</div>
        </div>
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
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
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
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 10000;
  animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-content {
  background: linear-gradient(135deg, #2c3e50, #1a252f);
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  min-width: 250px;
  max-width: 350px;
}

.toast-icona {
  font-size: 2rem;
}

.toast-testo h4 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
}

.toast-testo p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.3;
}

.toast-chiudi {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.2rem;
  cursor: pointer;
  margin-left: auto;
  align-self: flex-start;
}

.toast-chiudi:hover {
  color: white;
}

.toast-obiettivo .toast-content {
  border-left: 5px solid #f1c40f;
}
.toast-obiettivo .toast-testo h4 {
  color: #f1c40f;
}

.toast-amicizia .toast-content {
  border-left: 5px solid #3498db;
}
.toast-amicizia .toast-testo h4 {
  color: #3498db;
}

.toast-invito .toast-content {
  border-left: 5px solid #2ecc71;
}
.toast-invito .toast-testo h4 {
  color: #2ecc71;
}

.toast-fine_partita .toast-content {
  border-left: 5px solid #9b59b6;
}
.toast-fine_partita .toast-testo h4 {
  color: #9b59b6;
}

.btn-visualizza-risultati {
  background-color: var(--bg-color);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  margin-top: 10px;
  cursor: pointer;
  width: 100%;
  font-weight: bold;
}
.btn-visualizza-results:hover {
  filter: brightness(1.1);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

#btn-feed {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 20px;
  font-size: 1.2rem;
  background-color: #ffd700;
  color: #333;
  font-weight: bold;
  border-radius: 50px;
  border: none;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0); /* per fare in modo che se cliccato da mobile non si illumina di blu */
}

.badge-notifica {
  background: red;
  color: white;
  border-radius: 50%;
  padding: 2px 8px;
  font-size: 0.9rem;
  position: absolute;
  top: -5px;
  right: -5px;
}

#sidebar-feed {
  position: fixed;
  top: 115px;
  right: -350px;
  width: 350px;
  height: 100vh;
  background-color: #f4f4f4;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.2);
  transition: right 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  z-index: 1001;
}

#sidebar-feed.aperta {
  right: 0;
}

.header-feed {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #444;
  color: white;
}

.btn-chiudi-feed {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}

.area-annunci {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.annuncio-card {
  background: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #444;
}

.annuncio-card p {
  margin: 5px 0 0 0;
  color: #333;
}

.ora {
  color: #888;
  margin-right: 10px;
}

.tipo-badge {
  font-size: 0.7rem;
  background: #333;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
}

.annuncio-card.vittoria {
  border-left-color: #28a745;
}
.annuncio-card.vittoria .tipo-badge {
  background: #28a745;
}

.annuncio-card.nuovo_utente {
  border-left-color: #6f42c1;
}
.annuncio-card.nuovo_utente .tipo-badge {
  background: #6f42c1;
}

.btn-entra-invito {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  margin-top: 10px;
  cursor: pointer;
  width: 100%;
  font-weight: bold;
}
.btn-entra-invito:hover {
  filter: brightness(1.1);
}

@media only screen and (max-width : 800px) {
  #btn-feed {
    bottom: 10px;
    right : 10px;
    padding: 10px 15px;
    font-size: 0.9rem;
  }
  #sidebar-feed {
    width: 250px;
  }
}
</style>
