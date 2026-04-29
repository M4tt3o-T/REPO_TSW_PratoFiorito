import { reactive } from 'vue'

export const skin = reactive({
  temaPrincipale: '#42b9af',  //vecchio: #42b9af
  sfondoURL: "url('/pattern/images.jpeg')",
  icona : "🎭",
  
  cambiaTema(tema) {
    this.temaPrincipale = tema
  }
})

// Funzione di supporto per leggere il LocalStorage all'avvio
const utenteSalvato = localStorage.getItem('utente_campo_minato') 
  ? JSON.parse(localStorage.getItem('utente_campo_minato')) 
  : null;

export const sessione = reactive({
  // Inizializza con i dati del disco (se ci sono) invece che sempre con null
  utente: utenteSalvato, 
  
  setUtente(dati) { 
    this.utente = dati;
    // Salva nel disco rigido del browser
    localStorage.setItem('utente_campo_minato', JSON.stringify(dati));
  },
  
  logout() { 
    this.utente = null;
    // Cancella dal disco rigido
    localStorage.removeItem('utente_campo_minato');
    localStorage.removeItem('token_campo_minato');
  }
})