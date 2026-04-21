import { reactive } from 'vue'

export const skin = reactive({
  temaPrincipale: '#42b983',
  sfondoURL: "url('/pattern/images.jpeg')",
  
  cambiaTema(tema) {
    this.temaPrincipale = tema
  }
})