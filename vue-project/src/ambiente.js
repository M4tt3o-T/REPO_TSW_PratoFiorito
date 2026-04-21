import { reactive } from 'vue'

export const skin = reactive({
  temaPrincipale: '#42b983',
  sfondoURL: "url('/pattern/images.jpeg')",
  icona : "🎭",
  
  cambiaTema(tema) {
    this.temaPrincipale = tema
  }
})

export const gioco = reactive({
  difficulty: "Facile",
  dimensione_grid : "9",
  lista_giocatori : ["Nome1","Nome2","Nome3"]
})