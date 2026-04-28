import { reactive } from 'vue'

export const skin = reactive({
  temaPrincipale: '#42b9af',  //vecchio: #42b9af
  sfondoURL: "url('/pattern/images.jpeg')",
  icona : "🎭",
  
  cambiaTema(tema) {
    this.temaPrincipale = tema
  }
})