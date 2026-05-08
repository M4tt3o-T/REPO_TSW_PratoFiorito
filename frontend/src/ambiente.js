import { reactive } from 'vue'

// Recuperiamo l'aspetto salvato dal disco (se esiste)
const skinSalvata = localStorage.getItem('skin_campo_minato')
  ? JSON.parse(localStorage.getItem('skin_campo_minato'))
  : null

export const skin = reactive({
  temaPrincipale: skinSalvata?.tema || '#42b9af',
  sfondoURL: skinSalvata?.sfondo || "url('/pattern/sfondo_base.jpg')",
  icona: skinSalvata?.icona || '🎭',

  // Funzione interna per scrivere sul disco rigido
  salvaSuDisco() {
    localStorage.setItem(
      'skin_campo_minato',
      JSON.stringify({
        tema: this.temaPrincipale,
        sfondo: this.sfondoURL,
        icona: this.icona,
      }),
    )
  },

  cambiaTema(tema) {
    this.temaPrincipale = tema
    this.salvaSuDisco() // Salviamo al volo
  },

  cambiaSfondo(sfondo) {
    this.sfondoURL = sfondo
    this.salvaSuDisco()
  },

  cambiaIcona(icona) {
    this.icona = icona
    this.salvaSuDisco()
  },
})

// Funzione di supporto per leggere il LocalStorage all'avvio
const utenteSalvato = localStorage.getItem('utente_campo_minato')
  ? JSON.parse(localStorage.getItem('utente_campo_minato'))
  : null

export const sessione = reactive({
  // Inizializza con i dati del disco (se ci sono) invece che sempre con null
  utente: utenteSalvato,

  setUtente(dati) {
    if (dati && dati.id && !dati.id_utente) {
      dati.id_utente = dati.id
    }
    this.utente = dati
    // Salva nel disco rigido del browser
    localStorage.setItem('utente_campo_minato', JSON.stringify(dati))
  },

  logout() {
    this.utente = null
    // Cancella dal disco rigido
    localStorage.removeItem('utente_campo_minato')
    localStorage.removeItem('token_campo_minato')
  },
})

export const notifica = reactive({
  messaggio: '',
  visibile: false,

  mostra(msg) {
    this.messaggio = msg
    this.visibile = true
  },

  chiudi() {
    this.visibile = false
    this.messaggio = ''
  },
})

// Popup per gli obiettivi
export const toast = reactive({
  titolo: '',
  descrizione: '',
  visibile: false,
  timeout: null,

  mostra(tit, desc) {
    this.titolo = tit
    this.descrizione = desc
    this.visibile = true

    // Se c'era già un toast, resettiamo il timer
    if (this.timeout) clearTimeout(this.timeout)

    // Scompare da solo dopo 5 secondi
    this.timeout = setTimeout(() => {
      this.chiudi()
    }, 5000)
  },

  chiudi() {
    this.visibile = false
  },
})

// Gestore audio
export const sfx = reactive({
  attivo: true, // Utile per creare un tasto "Muta" nelle impostazioni in futuro
  volumeGenerale: 0.5,

  play(nomeSuono) {
    if (!this.attivo) return

    // Istanziamento rapido: permette a più suoni uguali di sovrapporsi se clicchi veloce
    const audio = new Audio(`/audio/effetti/${nomeSuono}`)
    audio.volume = this.volumeGenerale

    // Il catch intercetta l'errore che i browser danno se provi a far partire
    // un audio prima che l'utente abbia interagito con la pagina
    audio.play().catch((err) => console.warn('Riproduzione audio bloccata dal browser', err))
  },
})

// Creiamo l'elemento audio fuori dalla reattività per evitare conflitti con Vue
const audioElement = new Audio()
audioElement.volume = 0.3

// Jukebox Globale
export const playerMusicale = reactive({
  tracciaAttuale: null,
  inRiproduzione: false,
  progresso: 0,
  durata: 0,
  libreria: [], // Conterrà le canzoni acquistate

  impostaLibreria(inventarioCompleto) {
    this.libreria = inventarioCompleto.filter((item) => item.tipo === 'musica')
  },

  // Carica i brani dal database
  async aggiornaLibreria() {
    const token = localStorage.getItem('token_campo_minato')
    if (!token) return

    try {
      const API_URL = import.meta.env.VITE_SOCKET_URL
      const res = await fetch(`${API_URL}/api/shop/mio`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const dati = await res.json()
        this.impostaLibreria(dati.inventario)
        console.log('Libreria musicale aggiornata!')
      }
    } catch (err) {
      console.error('Errore refresh libreria musicale:', err)
    }
  },

  caricaTraccia(traccia) {
    if (!traccia) return
    this.tracciaAttuale = traccia
    audioElement.src = traccia.asset_url // es: '/audio/canzone1.mp3'
    audioElement.load()
    this.play()
  },

  play() {
    if (!this.tracciaAttuale) return
    audioElement
      .play()
      .then(() => {
        this.inRiproduzione = true
      })
      .catch((err) => console.warn('Riproduzione bloccata', err))
  },

  pausa() {
    audioElement.pause()
    this.inRiproduzione = false
  },

  toggle() {
    if (this.inRiproduzione) this.pausa()
    else this.play()
  },

  cambiaTempo(nuovoTempo) {
    audioElement.currentTime = nuovoTempo
    this.progresso = nuovoTempo
  },
})

// Ascoltatori nativi del browser per la barra di avanzamento
audioElement.addEventListener('timeupdate', () => {
  playerMusicale.progresso = audioElement.currentTime
})
audioElement.addEventListener('loadedmetadata', () => {
  playerMusicale.durata = audioElement.duration
})
audioElement.addEventListener('ended', () => {
  playerMusicale.inRiproduzione = false // Ferma l'icona play/pausa a fine canzone
})
