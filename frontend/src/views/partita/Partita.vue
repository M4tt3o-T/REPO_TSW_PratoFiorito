<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// Importiamo lo stato globale (es. tema visivo e impostazioni)
import { skin } from '../../ambiente.js'
// Importiamo la connessione al server WebSocket precedentemente inizializzata
import { socket } from '../../socket.js'
import { sessione, notifica, sfx } from '../../ambiente.js'
import Loading from '../../components/Loading.vue'

// Inizializzazione routing
const route = useRoute()
const router = useRouter()

// Estraiamo i dati dall'URL.
// params.id prende il valore dinamico del percorso (es. /partita/123 -> 123)
const idStanza = route.params.id
// query prende i parametri dopo il punto di domanda (es. ?azione=crea&dim=20)
// Se il parametro non esiste, impostiamo un valore di default
const azioneRichiesta = route.query.azione || 'unisciti'
const parametroDim = route.query.dim || 10
const parametroDiff = route.query.diff || 10

// Variabili reattive e stato del componente

// La griglia vuota che verrà riempita dai dati del server
const griglia = ref([])

// Flag per gestire l'interfaccia utente: mostra la scritta "Connessione in corso" finché il server non ci autorizza e ci invia la prima griglia.
const caricamento = ref(true)

// Determina se il click sinistro del mouse deve scoprire la cella o mettere una bandierina
const modalitaBandierina = ref(false)

const chatAperta = ref(false)
const storicoChat = ref([])
const nuovoMessaggio = ref('')
const notificheChat = ref(0) // Contatore messaggi non letti

// Variabili reattive per il popup di vittoria/sconfitta
const modalVisibile = ref(false)
const datiFinePartita = ref({
  esito: '',
  classifica: [],
  storico: false,
})

// Variabili per HUD e cronometro
const tempoGiocato = ref(0)
let timerIntervallo = null
const bandierinePiazzate = ref(0)
const puntiAttuali = ref(0)

// Funzione per inviare il messaggio:
const inviaMessaggio = () => {
  // Controlliamo che il testo non sia vuoto e che l'utente esista in memoria
  if (nuovoMessaggio.value.trim() !== '' && sessione.utente) {
    // Spediamo il pacchetto completo al server
    socket.emit('invia_messaggio_chat', {
      idPartita: idStanza,
      idUtente: sessione.utente.id_utente, // Fondamentale per il salvataggio nel Database
      username: sessione.utente.username, // Fondamentale per mostrare il nome nell'interfaccia degli altri
      icona: skin.icona,
      testo: nuovoMessaggio.value,
    })

    // Svuotiamo la casella di testo
    nuovoMessaggio.value = ''
  }
}

// Formatta il tempo in MM:SS
const tempoFormattato = computed(() => {
  const minuti = Math.floor(tempoGiocato.value / 60)
    .toString()
    .padStart(2, '0')
  const secondi = (tempoGiocato.value % 60).toString().padStart(2, '0')
  return `${minuti}:${secondi}`
})

const avviaTimer = () => {
  if (!timerIntervallo) {
    timerIntervallo = setInterval(() => {
      tempoGiocato.value++
    }, 1000)
  }
}

const fermaTimer = () => {
  if (timerIntervallo) {
    clearInterval(timerIntervallo)
    timerIntervallo = null
  }
}

// Ciclo di vita all'avvio del componente
onMounted(() => {
  // Se non c'è un utente loggato, rimandalo al login per sicurezza
  if (!sessione.utente) {
    router.push('/login')
    return
  }

  // 1. Apriamo il canale di comunicazione con il server Node.js usando il token di sicurezza
  socket.auth = { token: localStorage.getItem('token_campo_minato') }
  socket.connect()

  // 2. Invia la richiesta per entrare (o creare) la stanza
  socket.emit('unisciti_partita', {
    idPartita: idStanza,
    username: sessione.utente.username,
    idUtente: sessione.utente.id_utente,
    azione: azioneRichiesta,
    dimensione: parametroDim,
    difficolta: parametroDiff,
  })

  // 3. Ascolto eventi dal server:

  // Caso A: La stanza non esiste o è piena
  socket.on('errore_accesso', (messaggio) => {
    notifica.mostra(messaggio)
    router.push('/') // Reindirizzamento forzato alla home page
  })

  // Caso B: Il server ci invia lo stato del campo minato (mossa valida, inizio partita, ecc.)
  socket.on('aggiorna_griglia', (nuovaGriglia) => {
    griglia.value = nuovaGriglia // Vue aggiorna automaticamente l'HTML
    caricamento.value = false // Nascondiamo la scritta di caricamento
    avviaTimer()
  })

  // Caso C: Qualcuno ha vinto o ha calpestato una mina
  socket.on('partita_terminata', (dati) => {
    fermaTimer()
    // 1. Aggiorniamo la griglia visibile
    if (dati.griglia) {
      griglia.value = dati.griglia
    }

    // Se hai perso, riproduciamo l'esplosione
    if (dati.esito === 'sconfitta' && !dati.storico) {
      sfx.play('esplosione.wav')
    }

    // Se hai vinto, riproduciamo la melodia
    if (dati.esito === 'vittoria' && !dati.storico) {
      sfx.play('vittoria.wav')
    }

    // 2. Salviamo i dati per il popup
    datiFinePartita.value.esito = dati.esito
    datiFinePartita.value.classifica = dati.classifica || []
    datiFinePartita.value.storico = dati.storico || false

    // 3. Mostriamo il popup dopo un piccolo ritardo scenico
    setTimeout(() => {
      modalVisibile.value = true
    }, 1000)
  })

  socket.on('storico_chat', (messaggiPassati) => {
    storicoChat.value = messaggiPassati
  })

  socket.on('nuovo_messaggio_chat', (messaggio) => {
    storicoChat.value.push(messaggio)
  })

  // Ascolta lo storico quando si entra
  socket.on('storico_chat', (messaggiPassati) => {
    storicoChat.value = messaggiPassati
  })

  socket.off('nuovo_messaggio_chat') // Uccide eventuali cloni
  // Ricezione di un singolo nuovo messaggio
  socket.on('nuovo_messaggio_chat', (messaggio) => {
    storicoChat.value.push(messaggio)

    // Se la chat è chiusa, incrementiamo il pallino delle notifiche
    if (!chatAperta.value) {
      notificheChat.value++
    }

    // Auto-scroll verso il basso
    setTimeout(() => {
      const area = document.querySelector('.area-messaggi')
      if (area) area.scrollTop = area.scrollHeight
    }, 50)
  })

  socket.on('sync_hud', (datiSync) => {
    tempoGiocato.value = datiSync.tempo
    puntiAttuali.value = datiSync.punti
    bandierinePiazzate.value = datiSync.bandierine
    avviaTimer() // Riparte contando dai secondi corretti
  })
})

// Resettiamo le notifiche quando si apre la chat
const apriChat = () => {
  chatAperta.value = !chatAperta.value
  notificheChat.value = 0

  if (chatAperta.value) {
    socket.emit('sblocca_singolo', 'open_chat')
  }
}

// Funzione legata al bottone del popup
const chiudiE_TornaHome = () => {
  modalVisibile.value = false
  router.push('/')
}

// Ciclo di vita alla chiusura del componente
onUnmounted(() => {
  // Avvisiamo il server che stiamo uscendo dalla pagina (non dalla connessione)
  if (sessione.utente) {
    socket.emit('lascia_partita', {
      idPartita: idStanza,
      idUtente: sessione.utente.id_utente,
    })
  }

  // Rimuovere i "listener" quando l'utente cambia pagina.
  // Altrimenti, tornando su questa pagina, avremmo eventi duplicati in ascolto.
  socket.off('aggiorna_griglia')
  socket.off('errore_accesso')
  socket.off('partita_terminata')
  socket.off('storico_chat')
  socket.off('nuovo_messaggio_chat')
  socket.off('sync_hud')
})

const mostraInviti = ref(false)
const listaAmici = ref([])
const API_URL = import.meta.env.VITE_SOCKET_URL

const copiaCodice = () => {
  navigator.clipboard.writeText(idStanza)
  notifica.mostra('Codice Stanza copiato negli appunti!')
}

const ApriInviti = async () => {
  mostraInviti.value = true
  try {
    const token = localStorage.getItem('token_campo_minato')
    const res = await fetch(`${API_URL}/api/amici`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const dati = await res.json()
      listaAmici.value = dati.amici // Recuperiamo solo la lista degli amici accettati
    }
  } catch (err) {
    console.error('Errore caricamento amici:', err)
  }
}

const InvitaAmico = (idAmico) => {
  socket.emit('invia_invito_partita', {
    idDestinatario: idAmico,
    idPartita: idStanza,
    username: sessione.utente.username,
  })
  notifica.mostra('Invito inviato con successo!')
  mostraInviti.value = false
}

// Invocata al click su una cella
const scopriCella = (x, y) => {
  if (!sessione.utente) return // Sicurezza extra

  // Se la cella è già scoperta, ignoriamo il click per evitare suoni a vuoto
  if (griglia.value[y][x].isRevealed) return

  // Controlliamo quale strumento l'utente ha selezionato dalla bottoniera
  const azione = modalitaBandierina.value ? 'bandierina' : 'scopri'

  // Riproduciamo il suono adatto prima di inviare al server
  if (azione === 'scopri') {
    // Se sappiamo già che c'è una mina, non suoniamo il rumorino "scopri".
    // Lasciamo spazio al suono dell'esplosione che arriverà dal server un istante dopo.
    if (!griglia.value[y][x].isMine) {
      sfx.play('scopri.wav')
    }
  } else {
    sfx.play('bandierina.wav')
  }

  // Il client invia solo la mossa al server
  socket.emit('mossa_utente', {
    idPartita: idStanza,
    x: x,
    y: y,
    azione: azione,
    idUtente: sessione.utente.id_utente, // Inviamo l'utente per aggiornare il punteggio
  })
}

// Invocata al click destro del mouse
const mettiBandierina = (x, y) => {
  if (!sessione.utente) return
  if (griglia.value[y][x].isRevealed) return
  sfx.play('bandierina.wav')
  // Aumentiamo o diminuiamo il contatore locale (se la cella non è già scoperta)
  if (!griglia.value[y][x].isRevealed) {
    griglia.value[y][x].isFlagged ? bandierinePiazzate.value-- : bandierinePiazzate.value++
  }
  socket.emit('mossa_utente', {
    idPartita: idStanza,
    x: x,
    y: y,
    azione: 'bandierina',
    idUtente: sessione.utente.id_utente,
  })
}
</script>

<template>
  <div id="main">
    <Loading
      v-if="caricamento"
      :messaggio="'Connessione alla stanza ' + idStanza + '...'"
    ></Loading>

    <div v-else id="zonaPartita" class="finestra">
      <!-- -----------------HEADER------------- -->
      <div class="header-partita">
        <div class="info-stanza">
          <span
            >Stanza: <strong>{{ idStanza }}</strong></span
          >
          <button class="btn-copia" @click="copiaCodice">📋</button>
        </div>
        <button class="btn-invita" @click="ApriInviti">➕ Invita Amici</button>
      </div>

      <!-- -----------------STATISTICHE------------- -->
      <div id="hud-statistiche">
        <div class="stat-box">
          <span class="icona">⏱️</span><span class="valore">{{ tempoFormattato }}</span>
        </div>
        <div class="stat-box">
          <span class="icona">💰</span><span class="valore">{{ puntiAttuali }}</span>
        </div>
        <div class="stat-box">
          <span class="icona">🚩</span><span class="valore">{{ bandierinePiazzate }}</span>
        </div>
      </div>

      <!-- -----------------GLIGLIA------------- -->
      <div class="grid-container">
        <div v-for="(riga, y) in griglia" :key="'riga-' + y" class="riga-flex">
          <div
            v-for="(cella, x) in riga"
            :key="'cella-' + x"
            class="cella"
            :class="{ scoperta: cella.isRevealed, cella_small: parametroDim > 40 }"
            @click="scopriCella(x, y)"
            @contextmenu.prevent="mettiBandierina(x, y)"
          >
            <span v-if="!cella.isRevealed && cella.isFlagged">🚩</span>

            <span v-else-if="cella.isRevealed && cella.isMine">💣</span>

            <span v-else-if="cella.isRevealed && cella.adjacentMines > 0">{{
              cella.adjacentMines
            }}</span>
          </div>
        </div>
      </div>

      <!-- -----------------PULSANTI------------- -->
      <div id="div_pulsanti">
        <button
          class="pulsanti"
          :style="{ backgroundColor: !modalitaBandierina ? '#ccc' : '' }"
          @click="modalitaBandierina = false"
        >
          🧹
        </button>
        <button
          class="pulsanti"
          :style="{ backgroundColor: modalitaBandierina ? '#ccc' : '' }"
          @click="modalitaBandierina = true"
        >
          🚩
        </button>
      </div>
    </div>

    <!-- -----------------CHAT------------- -->
    <button id="btn-chat" @click="apriChat">
      💬 Chat
      <span v-if="notificheChat > 0" class="badge-notifica">{{ notificheChat }}</span>
    </button>

    <Teleport to="body">  <!--  Senza il teleport era impossibile sovrapporsi al bottone del feed -->
      <div id="sidebar-chat" :class="{ aperta: chatAperta }">
        <div class="header-chat">
          <h3>Chat Stanza {{ idStanza }}</h3>
          <button @click="chatAperta = false" id="btn-chiudiChat">X</button>
        </div>

        <div class="area-messaggi">
          <div v-for="(msg, index) in storicoChat" :key="index" class="messaggio">
            <span class="ora">[{{ msg.ora }}]</span>

            <span class="icona-chat">{{ msg.icona || '🎭' }}</span>

            <strong :class="{ 'mio-messaggio': msg.autore === sessione.utente.username }"
              >{{ msg.autore }}:</strong
            >
            {{ msg.testo }}
          </div>
        </div>

        <div class="input-chat">
          <input
            v-model="nuovoMessaggio"
            type="text"
            placeholder="Scrivi qui..."
            @keyup.enter="inviaMessaggio"
          />
          <button @click="inviaMessaggio">Invia</button>
        </div>
      </div>
    </Teleport>
    
  </div>

  <!-- ------------------RESOCONTO PARTITA--------------- -->
  <div v-if="modalVisibile" class="modal-overlay">
    <div class="modal-content">
      <h2 v-if="datiFinePartita.esito === 'vittoria' || datiFinePartita.esito === 'vinta'">
        🎉 VITTORIA!
      </h2>
      <h2 v-else>💥 SCONFITTA!</h2>

      <p v-if="datiFinePartita.storico" class="storico-badge">
        Stai visualizzando i risultati di una partita passata
      </p>

      <!-- La Classifica -->
      <div class="classifica-container">
        <h3>Classifica Partita</h3>
        <ul>
          <li v-for="(giocatore, index) in datiFinePartita.classifica" :key="index">
            <span class="posizione">#{{ index + 1 }}</span>
            <span class="nome">{{ giocatore.username }}</span>
            <span class="punti">{{ giocatore.punti }} pt</span>
          </li>
        </ul>
        <p v-if="datiFinePartita.classifica.length === 0">Nessun punteggio registrato.</p>
      </div>

      <!-- Bottone di uscita -->
      <button @click="chiudiE_TornaHome" class="btn-home">Torna alla Lobby</button>
    </div>
  </div>
  <div v-if="mostraInviti" class="modal-overlay" @click.self="mostraInviti = false">
    <div class="modal-content inviti-modal">
      <h2 style="margin-bottom: 20px">Invita un Amico</h2>
      <div class="lista-amici-invito">
        <div v-for="amico in listaAmici" :key="amico.id_utente" class="amico-row">
          <span>{{ amico.icona }} {{ amico.username }}</span>
          <button class="btn-invia-invito" @click="InvitaAmico(amico.id_utente)">Invita</button>
        </div>
        <div v-if="listaAmici.length === 0" style="color: #aaa">
          Nessun amico trovato. Aggiungili dal tuo Profilo!
        </div>
      </div>
      <button class="btn-home" @click="mostraInviti = false">Chiudi</button>
    </div>
  </div>
</template>

<style scoped>
/* 'scoped' significa che queste regole CSS si applicheranno SOLO a questa pagina e non andranno a rompere il layout del resto del sito.
*/

#chat {
  position: fixed;
  right: 4%;
  bottom: 5%;
  padding: 1.2%;
  background-color: var(--bg-color);
  /*background-color: rgb(220, 220, 220);*/
  font-size: 33px;
  opacity: 0.8;
}

#zonaPartita {
  height : fit-content;
  margin-top: 2%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem; 
}

#div_pulsanti {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  gap: 1rem;
}

.pulsanti {
  padding: 10px 20px;
  font-size: 1.5rem;
  cursor: pointer;
  border-radius: 8px;
}

.grid-container {
  border: 5px solid var(--bg-color);
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  max-width: 95vw;
  max-height: 65vh;
  overflow: auto;
}

.riga-flex {
  display: flex;
  width: max-content;
}

.cella {
  width: 40px;
  height: 40px;
  border: 1px solid #999;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  background-color: #bbb;
  font-weight: bold;
  font-size: 1.2rem;
  user-select: none;
  flex-shrink: 0;
}
.cella_small {
  width : 25px;
  height : 25px;
}

/* Classe applicata dinamicamente da Vue quando cella.isRevealed è true */
.cella.scoperta {
  background-color: #eee;
}

.cella:hover {
  filter: brightness(1.1); /* Illumina leggermente la cella al passaggio del mouse */
}

/* Pulsante per aprire la chat */
#btn-chat {
  position: fixed;
  bottom: 80px;
  right: 20px;
  padding: 15px 20px;
  font-size: 1.2rem;
  background-color: #333;
  color: white;
  border-radius: 50px;
  border: none;
  cursor: pointer;
  z-index: 99;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0); /* per fare in modo che se cliccato da mobile non si illumina di blu */
}

/* La barra laterale */
#sidebar-chat {
  position: fixed;
  top: 115px;
  right: -350px; /* Nascosta fuori dallo schermo di default */
  bottom: 0;
  width: 350px;
  background-color: #f9f9f9;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.2);
  transition: right 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  z-index: 1001;
}

/* Classe dinamica applicata da Vue per farla apparire */
#sidebar-chat.aperta {
  right: 0;
}

.header-chat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: v-bind('skin.temaPrincipale');
  color: white;
}

#btn-chiudiChat {
  border : none;
  padding : 3px;
  border-radius: 15px;
  font-weight : bold;
}

.area-messaggi {
  flex: 1;
  padding: 15px;
  overflow-y: auto; /* Aggiunge la barra di scorrimento se ci sono troppi messaggi */
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.messaggio {
  font-size: 0.95rem;
  color: #333;
}

.ora {
  color: #888;
  font-size: 0.8rem;
}

.mio-messaggio {
  color: v-bind('skin.temaPrincipale');
}

.input-chat {
  display: flex;
  padding: 10px;
  background-color: #ddd;
}

.input-chat input {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 5px;
  margin-right: 5px;
}

.input-chat button {
  padding: 10px 15px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

/* Stili per il Popup */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--bg-color, #222); /* Adatta ai tuoi colori */
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  color: white;
  min-width: 350px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.storico-badge {
  font-size: 0.9em;
  color: #ffaa00;
  margin-bottom: 20px;
}

.classifica-container {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: left;
}

.classifica-container ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.classifica-container li {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.classifica-container li:last-child {
  border-bottom: none;
}

.posizione {
  font-weight: bold;
  width: 30px;
  color: #aaa;
}
.nome {
  flex-grow: 1;
}
.punti {
  font-weight: bold;
  color: #4caf50;
}

.btn-home {
  margin-top: 15px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
}
.btn-home:hover {
  background-color: #0056b3;
}

#hud-statistiche {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  background-color: rgba(0, 0, 0, 0.1);
  padding: 10px 20px;
  border-radius: 8px;
}

.stat-box {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.icona-chat {
  margin: 0 4px;
  font-size: 1.1em;
}

/* Stili Header Partita e Inviti */
.header-partita {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 15px;
}

.info-stanza {
  background: rgba(0, 0, 0, 0.2);
  padding: 8px 15px;
  border-radius: 8px;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
}

.btn-copia {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  transition: transform 0.1s;
}
.btn-copia:hover {
  transform: scale(1.1);
}

.btn-invita {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}
.btn-invita:hover {
  background-color: #0056b3;
}

.inviti-modal {
  max-width: 400px;
}
.lista-amici-invito {
  background: rgba(0, 0, 0, 0.2);
  padding: 10px;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
}
.amico-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.btn-invia-invito {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

@media only screen and (max-width : 800px) {
  #btn-chat {
    bottom: 60px;
    right: 10px;
    padding: 10px 15px;
    font-size: 1rem;
  }
  #sidebar-chat {
    width : 250px;
  }
}

</style>
