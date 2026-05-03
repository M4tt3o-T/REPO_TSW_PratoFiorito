<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { sessione } from '../ambiente.js'
import { socket } from '../socket.js';

const router = useRouter();

// Variabili di stato

// Salva in tempo reale quello che l'utente digita nell'input "Unisciti"
const codiceStanza = ref("");

// Gestione del popup (modale)

// Se true, il div con la classe 'modal-overlay' diventa visibile
const mostraModale = ref(false);
// Se true, nasconde i bottoni preset e mostra gli slider
const modalitaPersonalizzata = ref(false);

// Valori predefiniti
const presetDimensione = ref(10); // Valori possibili: 10, 25, 50
const presetDifficolta = ref(10); // Valori possibili: 10, 15, 20

// Valori degli slider
const sliderDimensione = ref(10);
const sliderDifficolta = ref(10);

// A differenza di una 'ref' normale, una 'computed' si aggiorna da sola in base alle variabili che contiene.
// Quindi aggiorna la variabile solo se viene cambiato il valore, altrimenti usa quello di default
const dimensioneFinale = computed(() => modalitaPersonalizzata.value ? sliderDimensione.value : presetDimensione.value);
const difficoltaFinale = computed(() => modalitaPersonalizzata.value ? sliderDifficolta.value : presetDifficolta.value);

// Variabili per il modale dello storico
const modaleStorico = ref(false);
const partiteStorico = ref([]);
const filtroStato = ref('tutte'); // 'tutte', 'in_corso', 'vinta', 'persa'
const ordinamento = ref('data_desc'); // 'data_desc', 'data_asc', 'punti_desc', 'punti_asc'

// Funzioni di navigazione e interfaccia

// Mostra la finestra di personalizzazione della partita
const ApriModaleCreazione = () => {
  mostraModale.value = true;
};

// Nasconde la finestra
const ChiudiModale = () => {
  mostraModale.value = false;
};

// Funzione del pulsante per andare allo shop
const VaiShop = () => {
  router.push("/shop")
}

// Funzione del pulsante per andare all'inventario
const VaiInventario = () => {
  router.push("/inventario")
}

// Eseguita quando l'utente clicca "Inizia a Giocare!" nel modale
const ConfermaCreazione = () => {
  // 1. Inventiamo un numero di stanza casuale
  const idNuovaStanza = Math.floor(Math.random() * 10000);
  
  // 2. Usiamo il router per cambiare pagina.
  // Passiamo un oggetto per poter allegare i dati scelti nel modale.
  router.push({ 
    path: "/partita/" + idNuovaStanza, 
    query: { 
      azione: 'crea',
      dim: dimensioneFinale.value,
      diff: difficoltaFinale.value
    } 
  });
};

// Eseguita quando l'utente clicca "Unisciti" nella lobby
const UniscitiPartita = () => {
  // Il .trim() rimuove eventuali spazi vuoti accidentali inseriti dall'utente
  if (codiceStanza.value.trim() !== "") {
    // Navighiamo verso la stanza richiesta, specificando al server che non dobbiamo crearla
    router.push({ path: "/partita/" + codiceStanza.value, query: { azione: 'unisciti' } });
  } else {
    alert("Inserisci il codice della stanza!");
  }
};

// Ascoltiamo la risposta dal server
socket.on('storico_ricevuto', (dati) => {
    partiteStorico.value = dati;
});

const ApriStorico = () => {
    if (sessione.utente) {
        // Richiediamo i dati freschi ogni volta che apriamo il modal
        socket.emit('richiedi_storico', sessione.utente.id_utente);
        modaleStorico.value = true;
    }
};

const ChiudiStorico = () => {
    modaleStorico.value = false;
};

// Funzione per riusare la logica esistente
const EntraDaStorico = (chiave) => {
    codiceStanza.value = chiave; // Inseriamo la chiave nell'input
    modaleStorico.value = false; // Chiudiamo il modal
    UniscitiPartita(); // Chiamiamo la funzione esistente
};

// Calcola la percentuale di difficoltà per mostrarla nell'interfaccia
const calcolaDifficolta = (larghezza, mine) => {
    const totaleCelle = larghezza * larghezza;
    return Math.round((mine / totaleCelle) * 100);
};

// Computed property che filtra e ordina l'array originale
const storicoFiltrato = computed(() => {
    // 1. Filtro
    let filtrate = partiteStorico.value;
    if (filtroStato.value !== 'tutte') {
        filtrate = filtrate.filter(p => p.stato === filtroStato.value);
    }

    // 2. Ordinamento (creiamo una copia con slice() per non mutare l'originale)
    return filtrate.slice().sort((a, b) => {
        if (ordinamento.value === 'data_desc') {
            return new Date(b.data_creazione) - new Date(a.data_creazione);
        } else if (ordinamento.value === 'data_asc') {
            return new Date(a.data_creazione) - new Date(b.data_creazione);
        } else if (ordinamento.value === 'punti_desc') {
            return b.punti - a.punti;
        } else if (ordinamento.value === 'punti_asc') {
            return a.punti - b.punti;
        }
    });
});
</script>

<template>
  <div id="main">
    
    <div id="menu" class="finestra">
      <button @click="ApriModaleCreazione">Crea Nuova Partita</button>
      
      <div class="join-box">
        <input v-model="codiceStanza" type="text" placeholder="Codice es: 123" />
        <button class="btn-small" @click="UniscitiPartita">Unisciti</button>
      </div>

      <button v-if="sessione.utente" @click="ApriStorico">Storico Partite</button>
      <button @click="VaiInventario">Inventario</button>
      <button @click="VaiShop">Shop</button>
      <button>Obiettivi</button>
      <button>Classifica</button>
    </div>

    <div v-if="mostraModale" class="modal-overlay">
      <div class="modal-box">
        <h2 style="color: black; margin-bottom: 20px;">Impostazioni Partita</h2>
        
        <div class="sezione-impostazioni">
          
          <h3>Dimensione Campo</h3>
          <div class="bottoni-preset">
            <button class="btn-scelta" :class="{ attivo: presetDimensione === 10 && !modalitaPersonalizzata }" @click="presetDimensione = 10; modalitaPersonalizzata = false">Piccolo (10x10)</button>
            <button class="btn-scelta" :class="{ attivo: presetDimensione === 25 && !modalitaPersonalizzata }" @click="presetDimensione = 25; modalitaPersonalizzata = false">Medio (25x25)</button>
            <button class="btn-scelta" :class="{ attivo: presetDimensione === 50 && !modalitaPersonalizzata }" @click="presetDimensione = 50; modalitaPersonalizzata = false">Grande (50x50)</button>
          </div>

          <h3 style="margin-top: 20px;">Difficoltà (Mine)</h3>
          <div class="bottoni-preset">
            <button class="btn-scelta" :class="{ attivo: presetDifficolta === 10 && !modalitaPersonalizzata }" @click="presetDifficolta = 10; modalitaPersonalizzata = false">Facile (10%)</button>
            <button class="btn-scelta" :class="{ attivo: presetDifficolta === 15 && !modalitaPersonalizzata }" @click="presetDifficolta = 15; modalitaPersonalizzata = false">Medio (15%)</button>
            <button class="btn-scelta" :class="{ attivo: presetDifficolta === 20 && !modalitaPersonalizzata }" @click="presetDifficolta = 20; modalitaPersonalizzata = false">Difficile (20%)</button>
          </div>
        </div>

        <button class="btn-personalizza" @click="modalitaPersonalizzata = !modalitaPersonalizzata">
          {{ modalitaPersonalizzata ? '▲ Chiudi Personalizzazione' : '▼ Personalizza...' }}
        </button>

        <div v-if="modalitaPersonalizzata" class="sezione-custom">
          <label>Dimensione personalizzata: <b>{{ sliderDimensione }}x{{ sliderDimensione }}</b></label>
          <input type="range" v-model="sliderDimensione" min="5" max="100" class="slider" />

          <label style="margin-top: 15px;">Difficoltà personalizzata: <b>{{ sliderDifficolta }}% mine</b></label>
          <input type="range" v-model="sliderDifficolta" min="10" max="50" class="slider" />
        </div>

        <div class="modal-azioni">
          <button class="btn-annulla" @click="ChiudiModale">Annulla</button>
          <button class="btn-conferma" @click="ConfermaCreazione">Inizia a Giocare!</button>
        </div>
      </div>
    </div>
    <div v-if="modaleStorico" class="modal-overlay" @click.self="ChiudiStorico">
      <div class="modal-content storico-modal">
        <h2>Storico Partite</h2>
        
        <div class="controlli-storico">
          <div>
            <label>Stato: </label>
            <select v-model="filtroStato">
              <option value="tutte">Tutte</option>
              <option value="in_corso">In Corso</option>
              <option value="vinta">Vinte</option>
              <option value="persa">Perse</option>
            </select>
          </div>
          <div>
            <label>Ordina per: </label>
            <select v-model="ordinamento">
              <option value="data_desc">Più Recenti</option>
              <option value="data_asc">Meno Recenti</option>
              <option value="punti_desc">Punteggio (Alto-Basso)</option>
              <option value="punti_asc">Punteggio (Basso-Alto)</option>
            </select>
          </div>
        </div>

        <!-- Lista Partite -->
        <div class="lista-partite">
          <div v-if="storicoFiltrato.length === 0" class="no-partite">
            Nessuna partita trovata con questi filtri.
          </div>
          
          <div v-for="partita in storicoFiltrato" :key="partita.chiave_accesso" class="riga-partita">
            <div class="dettagli-partita">
              <strong>Data:</strong> {{ new Date(partita.data_creazione).toLocaleDateString() }} - {{ new Date(partita.data_creazione).toLocaleTimeString() }}<br>
              <strong>Campo:</strong> {{ partita.larghezza }}x{{ partita.larghezza }}<br>
              <strong>Difficoltà:</strong> {{ calcolaDifficolta(partita.larghezza, partita.numero_mine) }}%<br>
              <strong class="punti-testo">Punti Ottenuti:</strong> {{ partita.punti }}
            </div>
            
            <div class="azione-partita">
              <button 
                :class="['btn-stato', partita.stato]" 
                @click="EntraDaStorico(partita.chiave_accesso)">
                {{ partita.stato.toUpperCase().replace('_', ' ') }}
              </button>
            </div>
          </div>
        </div>
        
        <button class="btn-chiudi" @click="ChiudiStorico">Chiudi</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
  /* Stili del menu principale */

  #menu {
    margin: 3% auto; /* Lo centra orizzontalmente */
    display: flex; 
    flex-direction: column; 
    justify-content: center;
    padding: 2rem 0; /* Spazio interno invece di usare un'altezza rigida */
    width: 90%; /* Più largo sugli schermi piccoli */
    max-width: 500px; /* Evita che diventi gigante sugli schermi grandi */
    min-height: 60vh; /* Permette al contenitore di espandersi se i bottoni hanno bisogno di spazio */
    background-color: var(--bg-color);
    border-radius: 12px;
  }
  
  /* Targetizziamo solo i bottoni dentro il menu per non rompere i modali */
  #menu > button, 
  .join-box .btn-small { 
    /* clamp(minimo, ideale, massimo) - il testo non sarà mai più piccolo di 1rem */
    font-size: clamp(1rem, 2.5vw, 1.5rem); 
    margin: 10px 10%; 
    padding: 12px 20px;
    cursor: pointer; 
    flex-shrink: 0; /* Impedisce a Flexbox di schiacciare il bottone */
    border-radius: 8px;
    min-height: 50px; /* Garantisce una zona di tap comoda da mobile */
  }

  /* Stili per la casella "Unisciti" */
  .join-box { 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    margin: 15px 10%; 
    gap: 10px; 
  }
  
  .join-box input { 
    font-size: clamp(1rem, 2.5vw, 1.5rem);
    padding: 12px; 
    text-align: center; 
    width: 80%; 
    border-radius: 8px;
    box-sizing: border-box; /* Assicura che il padding non sfondi la larghezza */
  }
  
  .btn-small { 
    width: 80%; 
    margin: 0 !important; /* Sovrascrive il margine laterale per allinearsi all'input */
  }

  /* Stili del modale */
  
  /* Sfondo semi-trasparente che copre tutto il sito */
  .modal-overlay {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex; justify-content: center; align-items: center;
    z-index: 1000; /* Assicura che il modale stia sopra a tutto il resto */
  }
  
  /* Il riquadro bianco centrale */
  .modal-box {
    background: #f4f4f4; padding: 30px; border-radius: 12px;
    width: 90%; max-width: 600px; text-align: center;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  }
  
  .sezione-impostazioni h3 { color: #333; margin-bottom: 10px; }
  .bottoni-preset { display: flex; justify-content: center; gap: 10px; }
  
  /* Stile di base per i bottoni delle scelte rapide */
  .btn-scelta {
    font-size: 1rem; margin: 0; padding: 10px; border: 2px solid #ccc;
    background: white; color: #333; border-radius: 6px;
  }
  
  /* Classe aggiunta dinamicamente da Vue quando il bottone è selezionato */
  .btn-scelta.attivo { border-color: #42b983; background: #e6f7ef; font-weight: bold; }
  
  .btn-personalizza {
    font-size: 1rem; margin: 20px 0; padding: 5px 10px;
    background: none; border: none; color: #555; text-decoration: underline;
  }
  
  /* Contenitore grigio per gli slider */
  .sezione-custom {
    display: flex; flex-direction: column; align-items: center;
    background: #e9e9e9; padding: 15px; border-radius: 8px; margin-bottom: 20px;
  }
  .sezione-custom label { color: #333; font-size: 1.2rem; }
  .slider { width: 80%; margin-top: 10px; }

  /* Contenitore per Annulla e Conferma */
  .modal-azioni { display: flex; justify-content: space-between; margin-top: 20px; gap: 20px; }
  .btn-annulla { font-size: 1.2rem; margin: 0; flex: 1; background: #ccc; border: none; border-radius: 8px; }
  .btn-conferma { font-size: 1.2rem; margin: 0; flex: 2; background: #42b983; color: white; border: none; border-radius: 8px; }

  /* Stili del modale storico */

  .modal-content {
    background-color: #222222; 
    padding: 30px;
    border-radius: 12px;
    text-align: center;
    color: white;
    min-width: 350px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.9); 
  }

  .controlli-storico {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    background: rgba(0,0,0,0.2);
    padding: 10px;
    border-radius: 8px;
  }

  .controlli-storico select {
    padding: 5px;
    border-radius: 4px;
    background-color: #333;
    color: white;
    border: 1px solid #555;
  }

  .lista-partite {
    max-height: 50vh;
    overflow-y: auto;
    margin-bottom: 20px;
  }

  .riga-partita {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255,255,255,0.05);
    margin-bottom: 10px;
    padding: 15px;
    border-radius: 8px;
    text-align: left;
    border-left: 4px solid transparent;
    gap: 20px;
  }

  .riga-partita:hover {
    background: rgba(255,255,255,0.1);
  }

  .dettagli-partita {
    font-size: 0.9em;
    line-height: 1.4;
    flex-grow: 1;
  }

  .azione-partita {
    flex-shrink: 0; 
  }

  .punti-testo {
    color: #4caf50;
  }

  .btn-stato {
    margin: 0;
    padding: 10px 15px;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    min-width: 110px;
    transition: transform 0.1s;
    white-space: nowrap;
  }

  .btn-stato:hover {
    transform: scale(1.05);
  }

  /* Colori dinamici per lo stato */
  .btn-stato.in_corso {
    background-color: #f39c12;
    color: white;
  }
  .btn-stato.vinta {
    background-color: #2ecc71;
    color: white;
  }
  .btn-stato.persa {
    background-color: #e74c3c;
    color: white;
  }

  .no-partite {
    text-align: center;
    padding: 20px;
    color: #aaa;
  }

  .storico-modal {
    min-width: 500px;
    max-width: 90vw;
  }

  .btn-chiudi {
    margin: 20px auto 0 auto;
    background-color: #555;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
  .btn-chiudi:hover {
    background-color: #777;
  }
</style>