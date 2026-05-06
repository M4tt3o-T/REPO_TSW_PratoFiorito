<script setup>
  import { ref, onMounted } from 'vue'
  import { sessione } from '../../ambiente.js'
  const API_URL = import.meta.env.VITE_SOCKET_URL;

  const obiettiviRaggiunti = ref([])
  const obiettiviNonRaggiunti = ref([])
  const errore = ref(null)

  const caricaObiettivi = async () => {
    try {
      const token = localStorage.getItem('token_campo_minato');
      
      // Se l'utente non è loggato, blocchiamo la funzione
      if (!token || !sessione.utente) return;

      // Passiamo l'header Authorization per superare il middleware 'auth'
      const response = await fetch(`${API_URL}/api/stats/obiettivi`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Errore nel caricamento degli obiettivi')
      
      const dati = await response.json()
      obiettiviRaggiunti.value = dati.raggiunti
      obiettiviNonRaggiunti.value = dati.non_raggiunti
      
      console.log("Obiettivi caricati correttamente")
    } catch (err) {
      errore.value = err.message
      console.error(err)
    }
  }

  onMounted(caricaObiettivi)
</script>

<template>
  <div id="main">
    <div id="div_obiettivi" class="finestra">

      <div id="div_obiettivi_raggiunti">
        <h2>Obiettivi Completati ✅</h2>
        
        <div v-for="ob in obiettiviRaggiunti" :key="ob.id_traguardo" class="obiettivo raggiunto">
          <div class="div_titolo_data">
            <h3 class="titolo">{{ ob.titolo }}</h3>
            <span class="data">{{ ob.data_sblocco }}</span>
          </div>
          <span class="descrizione">{{ ob.descrizione }}</span>
        </div>
      </div>
      
      <div id="div_obiettivi_non_raggiunti">
        <h2>Obiettivi Non Completati ❌</h2>

        <div v-for="ob in obiettiviNonRaggiunti" :key="ob.id_traguardo" class="obiettivo nonRaggiunto">
          <h3>{{ ob.titolo }}</h3>
          <span>{{ ob.descrizione }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  #div_obiettivi {
    margin: 5vh auto;
    width:40%;
    max-width: 600px;
    max-height: 70vh;
    padding:30px;
    overflow-y:auto;
    scrollbar-color : color-mix(in srgb, var(--bg-color), black 50%) var(--bg-color);
  }

  #div_obiettivi_raggiunti,#div_obiettivi_non_raggiunti {
    padding:5px;
    margin: 0px auto 40px;
  }

  .obiettivo {
    background-color: color-mix(in srgb, var(--bg-color),white 40%);
    border-radius: 10px;
    margin: 20px auto;
    padding:10px 20px;
    transition: all 0.3s ease;
  }
  .obiettivo:hover {
    transform: scale(0.98);
  }

  .nonRaggiunto {
    color: color-mix(in srgb, black, grey 75%);
  }

  .raggiunto:hover {
    border-left: solid 7px green;
    transform: scale(0.98);
  }
  .nonRaggiunto:hover {
    border-left: solid 7px red;
    color: color-mix(in srgb, black, grey 20%);
  }

  h2 {
    text-align: center;
    letter-spacing: 2px;
    margin-bottom: 20px;
  }

  h3 {
    letter-spacing: 1px;
    font-size:21px;
  }

  .div_titolo_data {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .data {
    font-size: 14px;
    color: color-mix(in srgb, var(--bg-color), black 60%)
  }

</style>