<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

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

// Funzioni di navigazione e interfaccia

// Mostra la finestra di personalizzazione della partita
const ApriModaleCreazione = () => {
  mostraModale.value = true;
};

// Nasconde la finestra
const ChiudiModale = () => {
  mostraModale.value = false;
};

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
</script>

<template>
  <div id="main">
    
    <div id="menu">
      <button @click="ApriModaleCreazione">Crea Nuova Partita</button>
      
      <div class="join-box">
        <input v-model="codiceStanza" type="text" placeholder="Codice es: 123" />
        <button class="btn-small" @click="UniscitiPartita">Unisciti</button>
      </div>

      <button>Inventario</button>
      <button>Shop</button>
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

  </div>
</template>

<style scoped>
  /* Stili del menu principale */
  #menu {
    margin-top:3%;
    display: flex; 
    flex-direction: column; 
    justify-content: center;
    padding-top: 4rem; 
    width: 48%; 
    height: 70%;
    background-color: var(--bg-color);
  }
  button { font-size: 1.5dvw; margin: 1.7rem 10%; cursor: pointer; }
  input { font-size: 1.5dvw; }
  
  /* Stili per la casella "Unisciti" */
  .join-box { display: flex; flex-direction: column; align-items: center; margin: 0 10%; gap: 10px; }
  .join-box input { font-size: 1.5rem; padding: 10px; text-align: center; width: 80%; }
  .btn-small { font-size: 1.5rem; margin: 0; width: 80%; }

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
</style>