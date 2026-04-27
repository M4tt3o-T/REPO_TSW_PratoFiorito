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

// Ciclo di vita all'avvio del componente
onMounted(() => {
  // 1. Apriamo il canale di comunicazione con il server Node.js
  socket.connect();
  
  // 2. Invia la richiesta per entrare (o creare) la stanza
  socket.emit('unisciti_partita', { 
    idPartita: idStanza, 
    username: "Giocatore_" + Math.floor(Math.random() * 100), // Nome temporaneo
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
});

// Ciclo di vita alla chiusura del componente
onUnmounted(() => {
  // Rimuovere i "listener" quando l'utente cambia pagina.
  // Altrimenti, tornando su questa pagina, avremmo eventi duplicati in ascolto.
  socket.off('aggiorna_griglia');
  socket.off('errore_accesso');
  socket.off('partita_terminata');
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

  </div>
</template>

<style scoped>
/* 'scoped' significa che queste regole CSS si applicheranno SOLO a questa pagina e non andranno a rompere il layout del resto del sito.
*/

#zonaPartita {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  /* Utilizziamo v-bind per iniettare una variabile reattiva JS nel CSS */
  background-color: v-bind('skin.temaPrincipale');
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
  border: 5px solid v-bind('skin.temaPrincipale');
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
</style>