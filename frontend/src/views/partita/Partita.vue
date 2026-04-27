<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// Importiamo lo stato globale (es. tema visivo e impostazioni)
import { skin } from '../../ambiente.js';
// Importiamo la connessione al server WebSocket precedentemente inizializzata
import { socket } from '../../socket.js';

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

// Il nome del giocatore (temporaneo)
const nomeGiocatore = "Giocatore_" + Math.floor(Math.random() * 100);

// Funzione per inviare il messaggio:
const inviaMessaggio = () => {
  if (nuovoMessaggio.value.trim() !== "") {
    socket.emit('invia_messaggio_chat', {
      idPartita: idStanza,
      username: nomeGiocatore,
      testo: nuovoMessaggio.value
    });
    nuovoMessaggio.value = ""; // Svuota l'input dopo l'invio
  }
};

// Ciclo di vita all'avvio del componente
onMounted(() => {
  // 1. Apriamo il canale di comunicazione con il server Node.js
  socket.connect();
  
  // 2. Invia la richiesta per entrare (o creare) la stanza
  socket.emit('unisciti_partita', { 
    idPartita: idStanza, 
    username: nomeGiocatore,
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
    griglia.value = dati.griglia; // Mostriamo l'ultimo frame (svela tutte le bombe)
    
    // Usiamo un piccolo ritardo (500ms) per permettere a Vue di renderizzare le bombe a schermo prima che l'alert blocchi l'esecuzione del browser.
    setTimeout(() => {
      if (dati.esito === 'vittoria') alert("🎉 HAI VINTO!");
      else alert("💥 BOOM! Hai calpestato una mina.");
      
      router.push('/'); // A fine partita, si torna alla lobby
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
  // Controlliamo quale strumento l'utente ha selezionato dalla bottoniera
  const azione = modalitaBandierina.value ? 'bandierina' : 'scopri';
  
  // Il client invia solo la mossa al server
  socket.emit('mossa_utente', { idPartita: idStanza, x: x, y: y, azione: azione });
};

// Invocata al click destro del mouse
const mettiBandierina = (x, y) => {
  socket.emit('mossa_utente', { idPartita: idStanza, x: x, y: y, azione: 'bandierina' });
};
</script>

<template>
  <div id="main">

    <div v-if="caricamento" style="font-size: 2rem; color: #333; text-align: center; padding-top: 20%;">
      Connessione alla stanza {{ idStanza }} in corso...
    </div>

    <div v-else id="zonaPartita">
      
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
          <strong :class="{ 'mio-messaggio': msg.autore === nomeGiocatore }">{{ msg.autore }}:</strong> 
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
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  /* Utilizziamo v-bind per iniettare una variabile reattiva JS nel CSS */
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
  /* Bordo dinamico basato sul tema globale */
  border: 5px solid var(--bg-color);
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
}

.riga-flex {
  display: flex; /* Dispone le celle una accanto all'altra orizzontalmente */
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
  user-select: none; /* Impedisce all'utente di selezionare testualmente i numeri/icone trascinando il mouse */
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
</style>