<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// Importiamo lo stato globale (es. tema visivo e impostazioni)
import { skin } from '../../ambiente.js';
// Importiamo la connessione al server WebSocket precedentemente inizializzata
import { socket } from '../../socket.js';
import { sessione } from '../../ambiente.js'

// Inizializzazione routing
const route = useRoute();
const router = useRouter();

// Estraiamo i dati dall'URL. 
// params.id prende il valore dinamico del percorso (es. /partita/123 -> 123)
const idStanza = route.params.id;
// query prende i parametri dopo il punto di domanda (es. ?azione=crea&dim=20)
// Se il parametro non esiste, impostiamo un valore di default
const azioneRichiesta = route.query.azione || 'unisciti';
const parametroDim = route.query.dim || 10; 
const parametroDiff = route.query.diff || 10;

// Variabili reattive e stato del componente

// La griglia vuota che verrà riempita dai dati del server
const griglia = ref([]);

// Flag per gestire l'interfaccia utente: mostra la scritta "Connessione in corso" finché il server non ci autorizza e ci invia la prima griglia.
const caricamento = ref(true); 

// Determina se il click sinistro del mouse deve scoprire la cella o mettere una bandierina
const modalitaBandierina = ref(false);

const chatAperta = ref(false);
const storicoChat = ref([]);
const nuovoMessaggio = ref("");
const notificheChat = ref(0); // Contatore messaggi non letti

// Variabili reattive per il popup di vittoria/sconfitta
const modalVisibile = ref(false);
const datiFinePartita = ref({
    esito: '',
    classifica: [],
    storico: false
});

// Funzione per inviare il messaggio:
const inviaMessaggio = () => {
  // Controlliamo che il testo non sia vuoto e che l'utente esista in memoria
  if (nuovoMessaggio.value.trim() !== "" && sessione.utente) {
    
    // Spediamo il pacchetto completo al server
    socket.emit('invia_messaggio_chat', {
      idPartita: idStanza,
      idUtente: sessione.utente.id_utente, // Fondamentale per il salvataggio nel Database
      username: sessione.utente.username,  // Fondamentale per mostrare il nome nell'interfaccia degli altri
      testo: nuovoMessaggio.value
    });
    
    // Svuotiamo la casella di testo
    nuovoMessaggio.value = ""; 
  }
};

// Ciclo di vita all'avvio del componente
onMounted(() => {

  // Se non c'è un utente loggato, rimandalo al login per sicurezza
  if (!sessione.utente) {
    router.push('/login');
    return;
  }
  
  // 1. Apriamo il canale di comunicazione con il server Node.js usando il token di sicurezza
  socket.auth = { token: localStorage.getItem('token_campo_minato') };
  socket.connect();
  
  // 2. Invia la richiesta per entrare (o creare) la stanza
  socket.emit('unisciti_partita', { 
    idPartita: idStanza, 
    username: sessione.utente.username,
    idUtente: sessione.utente.id_utente,
    azione: azioneRichiesta,
    dimensione: parametroDim,
    difficolta: parametroDiff
  });

  // 3. Ascolto eventi dal server:
  
  // Caso A: La stanza non esiste o è piena
  socket.on('errore_accesso', (messaggio) => {
    alert(messaggio);
    router.push('/'); // Reindirizzamento forzato alla home page
  });

  // Caso B: Il server ci invia lo stato del campo minato (mossa valida, inizio partita, ecc.)
  socket.on('aggiorna_griglia', (nuovaGriglia) => {
    griglia.value = nuovaGriglia; // Vue aggiorna automaticamente l'HTML
    caricamento.value = false;    // Nascondiamo la scritta di caricamento
  });

  // Caso C: Qualcuno ha vinto o ha calpestato una mina
  socket.on('partita_terminata', (dati) => {
    // 1. Aggiorniamo la griglia visibile
    if (dati.griglia) {
        griglia.value = dati.griglia; 
    }
    
    // 2. Salviamo i dati per il popup
    datiFinePartita.value.esito = dati.esito;
    datiFinePartita.value.classifica = dati.classifica || [];
    datiFinePartita.value.storico = dati.storico || false;

    // 3. Mostriamo il popup dopo un piccolo ritardo scenico (opzionale)
    setTimeout(() => {
        modalVisibile.value = true;
    }, 500);
  });

  socket.on('storico_chat', (messaggiPassati) => {
    storicoChat.value = messaggiPassati;
  });

  socket.on('nuovo_messaggio_chat', (messaggio) => {
    storicoChat.value.push(messaggio);
  });

  // Ascolta lo storico quando si entra
  socket.on('storico_chat', (messaggiPassati) => {
    storicoChat.value = messaggiPassati;
  });

  socket.off('nuovo_messaggio_chat'); // Uccide eventuali cloni
  // Ricezione di un singolo nuovo messaggio
  socket.on('nuovo_messaggio_chat', (messaggio) => {
    storicoChat.value.push(messaggio);
    
    // Se la chat è chiusa, incrementiamo il pallino delle notifiche
    if (!chatAperta.value) {
      notificheChat.value++;
    }

    // Auto-scroll verso il basso
    setTimeout(() => {
      const area = document.querySelector('.area-messaggi');
      if (area) area.scrollTop = area.scrollHeight;
    }, 50);
  });
});

// Resettiamo le notifiche quando si apre la chat
const apriChat = () => {
  chatAperta.value = true;
  notificheChat.value = 0;
};

// Funzione legata al bottone del popup
const chiudiE_TornaHome = () => {
    modalVisibile.value = false;
    router.push('/');
};

// Ciclo di vita alla chiusura del componente
onUnmounted(() => {
  // Rimuovere i "listener" quando l'utente cambia pagina.
  // Altrimenti, tornando su questa pagina, avremmo eventi duplicati in ascolto.
  socket.off('aggiorna_griglia');
  socket.off('errore_accesso');
  socket.off('partita_terminata');
  socket.off('storico_chat');
  socket.off('nuovo_messaggio_chat');
});

//Funzioni di interazione con l'utente

// Invocata al click su una cella
const scopriCella = (x, y) => {
  if (!sessione.utente) return; // Sicurezza extra
  // Controlliamo quale strumento l'utente ha selezionato dalla bottoniera
  const azione = modalitaBandierina.value ? 'bandierina' : 'scopri';
  
  // Il client invia solo la mossa al server
  socket.emit('mossa_utente', {
    idPartita: idStanza,
    x: x,
    y: y,
    azione: 'scopri',
    idUtente: sessione.utente.id_utente // Inviamo l'utente per aggiornare il punteggio
  });
};

// Invocata al click destro del mouse
const mettiBandierina = (x, y) => {
  if (!sessione.utente) return;
  socket.emit('mossa_utente', {
    idPartita: idStanza,
    x: x,
    y: y,
    azione: 'bandierina',
    idUtente: sessione.utente.id_utente
  });
};
</script>

<template>
  <div id="main">

    <div v-if="caricamento" style="font-size: 2rem; color: #333; text-align: center; padding-top: 20%;">
      Connessione alla stanza {{ idStanza }} in corso...
    </div>

    <div v-else id="zonaPartita" class="finestra">
      
      <div class="grid-container">
        <div v-for="(riga, y) in griglia" :key="'riga-'+y" class="riga-flex">
          
          <div 
            v-for="(cella, x) in riga" 
            :key="'cella-'+x"
            class="cella"
            :class="{ 'scoperta': cella.isRevealed }" 
            @click="scopriCella(x, y)"
            @contextmenu.prevent="mettiBandierina(x, y)" 
          >
            <span v-if="!cella.isRevealed && cella.isFlagged">🚩</span>
            
            <span v-else-if="cella.isRevealed && cella.isMine">💣</span>
            
            <span v-else-if="cella.isRevealed && cella.adjacentMines > 0">{{ cella.adjacentMines }}</span>
          </div>
        </div>
      </div>

      <div id="div_pulsanti">
        <button class="pulsanti" :style="{ backgroundColor: !modalitaBandierina ? '#ccc' : '' }" @click="modalitaBandierina = false">🧹</button>
        <button class="pulsanti" :style="{ backgroundColor: modalitaBandierina ? '#ccc' : '' }" @click="modalitaBandierina = true">🚩</button>
      </div>
    </div>

    <button id="btn-chat" @click="chatAperta = !chatAperta">
      💬 Chat
      <span v-if="notificheChat > 0" class="badge-notifica">{{ notificheChat }}</span>
    </button>

    <div id="sidebar-chat" :class="{ 'aperta': chatAperta }">
      <div class="header-chat">
        <h3>Chat Stanza {{ idStanza }}</h3>
        <button @click="chatAperta = false">X</button>
      </div>
      
      <div class="area-messaggi">
        <div v-for="(msg, index) in storicoChat" :key="index" class="messaggio">
          <span class="ora">[{{ msg.ora }}]</span> 
          <strong :class="{ 'mio-messaggio': msg.autore === sessione.utente.username }">{{ msg.autore }}:</strong> 
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

  </div>
  <!-- OVERLAY DEL MODAL -->
  <div v-if="modalVisibile" class="modal-overlay">
    <div class="modal-content">
      
      <!-- Intestazione dinamica -->
      <h2 v-if="datiFinePartita.esito === 'vittoria' || datiFinePartita.esito === 'vinta'">
        🎉 VITTORIA!
      </h2>
      <h2 v-else>
        💥 SCONFITTA!
      </h2>
      
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
</template>

<style scoped>
/* 'scoped' significa che queste regole CSS si applicheranno SOLO a questa pagina e non andranno a rompere il layout del resto del sito.
*/

#chat{
  position : fixed;
  right : 4%;
  bottom : 5%;
  padding : 1.2%;
  background-color: var(--bg-color);
  /*background-color: rgb(220, 220, 220);*/
  font-size: 33px;
  opacity: 0.8;
}

#zonaPartita {
  margin-top:5%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: var(--bg-color);
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
  bottom: 20px;
  right: 20px;
  padding: 15px 20px;
  font-size: 1.2rem;
  background-color: #333;
  color: white;
  border-radius: 50px;
  border: none;
  cursor: pointer;
  z-index: 99;
}

/* La barra laterale */
#sidebar-chat {
  position: fixed;
  top: 0;
  right: -350px; /* Nascosta fuori dallo schermo di default */
  width: 350px;
  height: 100vh;
  background-color: #f9f9f9;
  box-shadow: -5px 0 15px rgba(0,0,0,0.2);
  transition: right 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  z-index: 100;
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

.area-messaggi {
  flex: 1; /* Prende tutto lo spazio verticale disponibile */
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
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
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
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.classifica-container li:last-child {
  border-bottom: none;
}

.posizione { font-weight: bold; width: 30px; color: #aaa; }
.nome { flex-grow: 1; }
.punti { font-weight: bold; color: #4caf50; }

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
.btn-home:hover { background-color: #0056b3; }
</style>