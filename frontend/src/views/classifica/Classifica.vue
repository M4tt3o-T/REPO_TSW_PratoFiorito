<script setup>

  import { ref, onMounted } from 'vue'
  const API_URL = import.meta.env.VITE_SOCKET_URL;

  const listaClassifica=ref([])
  const errore = ref(null)

  const caricaClassifica = async () => {
    try {
      const response = await fetch(`${API_URL}/api/classifica`)
      if (!response.ok) throw new Error('Errore nel caricamento classifica')
      const dati = await response.json()
      listaClassifica.value = dati.items
      console.log("Classifica caricata correttamente")
    } catch (err) {
      errore.value = err.message
      console.error(err)
    }
  }

  onMounted(caricaClassifica)

</script>

<template>

  <div id="main">
    <div id="div_classifica" class="finestra">
      <h2>🏆 CLASSIFICA GLOBALE</h2>

      <!-- Esempio Statico (Placeholder) -->
      <div class="entry_classifica first_player">
        <div class="div_nome_nPartite">
          <span class="rank">#1</span>
          <h3 class="nome">DarkAngelCraft</h3>
          <span class="n_partite">Partite: <b>69</b></span>
        </div>
        <div class="div_punteggio_ratio">
          <span class="punteggio">4200 <span>pt</span></span>
          <span class="ratio">W/L: <b>0.69</b></span>
        </div>
      </div>

      <div v-for="(player, index) in listaClassifica" 
        :key="player.id" 
        class="entry_classifica"
        :class="{ 'first_player': index === 0 , 'second_player': index === 1, 'third_player': index === 2}"
      >
        <div class="div_nome_nPartite">
          <span class="rank">#{{ index + 2 }}</span>
          <h3 class="nome">{{ player.nome }}</h3>
          <span class="n_partite">Partite: <b>{{ player.n_partite }}</b></span>
        </div>
        <div class="div_punteggio_ratio">
          <span class="punteggio">{{ player.punteggio }} <span>pt</span></span>
          <span class="ratio">W/L: <b>{{ player.ratio }}</b></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  #div_classifica {
    width: 40%; 
    max-width: 600px;
    margin: 5vh auto;
    padding: 30px;
    background-color: var(--bg-color);
  }

  h2 {
    text-align: center;
    margin-bottom: 30px;
    color: #ffcc00;
    letter-spacing: 2px;
  }

  .entry_classifica {
    background-color: color-mix(in srgb, var(--bg-color), white 5%);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 25px;
    margin-bottom: 12px;
    border-radius: 12px;
    transition: all 0.2s;
    border-left: 5px solid transparent;
  }

  .entry_classifica:hover {
    transform: scale(0.98);
    background-color: color-mix(in srgb, var(--bg-color), white 12%);
  }

  /* Stile speciale per il primo in classifica */
  .first_player {
    background-color: color-mix(in srgb, var(--bg-color), #ffcc00 15%);
    border-left: 5px solid #ffcc00;
    transform: scale(1.02);
  }

  /* Stile speciale per il secondo in classifica */
  .second_player {
    background-color: color-mix(in srgb, var(--bg-color), #C0C0C0 15%);
    border-left: 5px solid #C0C0C0;
    transform: scale(1.02);
  }

  /* Stile speciale per il terzo in classifica */
  .third_player {
    background-color: color-mix(in srgb, var(--bg-color), #CD7F32 15%);
    border-left: 5px solid #CD7F32;
    transform: scale(1.02);
  }

  .rank {
    font-weight: 900;
    font-size: 0.9rem;
    color: rgba(255,255,255,0.6);
    margin-right: 10px;
  }

  .div_nome_nPartite {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .nome {
    margin: 0;
    font-size: 1.2rem;
    color: white;
  }

  .n_partite {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.6);
  }

  .div_punteggio_ratio {
    text-align: right;
  }

  .punteggio {
    display: block;
    font-size: 1.4rem;
    font-weight: bold;
    color: #2ecc71; /* Verde smeraldo */
  }

  .punteggio span {
    font-size: 0.7rem;
    opacity: 0.7;
  }

  .ratio {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.7);
  }

  @media (max-width: 800px) {
    #div_classifica { width: 90%; padding: 15px; }
    .nome { font-size: 1rem; }
    .punteggio { font-size: 1.1rem; }
  }
</style>