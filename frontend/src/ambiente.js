import { reactive } from 'vue'

export const skin = reactive({
  temaPrincipale: '#42b983',
  sfondoURL: "url('/pattern/images.jpeg')",
  icona : "🎭",
  
  cambiaTema(tema) {
    this.temaPrincipale = tema
  }
})