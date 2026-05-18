<script setup>
import { ref, onMounted, watch } from 'vue'
import { skin, sessione, playerMusicale } from '../ambiente'
import { useRouter } from 'vue-router'

const menuMusica = ref(false)

const router = useRouter()
const API_URL = import.meta.env.VITE_SOCKET_URL

const TornaHome = () => router.push('/')
const VaiLogin = () => router.push('/login')
const VaiShop = () => router.push('/shop')
const VaiProfilo = () => router.push('/profilo')

const EseguiLogout = () => {
  playerMusicale.pausa() // Fermiamo la musica se esce
  sessione.logout()
  router.push('/')
}

// Funzione che recupera l'inventario per sapere che musica possiede l'utente
const caricaLibreriaMusicale = async () => {
  if (!sessione.utente) return
  const token = localStorage.getItem('token_campo_minato')
  if (!token) return

  try {
    const res = await fetch(`${API_URL}/api/shop/mio`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const dati = await res.json()
      playerMusicale.impostaLibreria(dati.inventario)
    }
  } catch (err) {
    console.error('Errore caricamento libreria musicale', err)
  }
}

// Carichiamo la libreria all'avvio e se l'utente cambia
onMounted(() => {
  playerMusicale.aggiornaLibreria() // Chiama la funzione centralizzata
})

watch(
  () => sessione.utente,
  () => {
    playerMusicale.aggiornaLibreria() // Ricarica se l'utente cambia
  },
)

// Gestore per il cambio traccia dal menu a tendina
const gestisciCambioTraccia = (evento) => {
  const urlSelezionato = evento.target.value
  if (!urlSelezionato) return

  const traccia = playerMusicale.libreria.find((t) => t.asset_url === urlSelezionato)
  playerMusicale.caricaTraccia(traccia)
}

// Gestore per la barra di avanzamento (Slider)
const scorrimentoSlider = (evento) => {
  playerMusicale.cambiaTempo(evento.target.value)
}

// Formatta il tempo in mm:ss per il player
const formattaTempo = (secondi) => {
  const m = Math.floor(secondi / 60)
    .toString()
    .padStart(2, '0')
  const s = Math.floor(secondi % 60)
    .toString()
    .padStart(2, '0')
  return `${m}:${s}`
}
</script>

<template>
  <div id="main-header">

    <!-- ------------------------------LOGO------------------------------------------------ -->

    <picture id="logo">
      <source media="(max-width: 800px)" srcset="/logo_sml.png">
      <img  src="/logo.png" alt="MinesweeperMMO Logo" @click="TornaHome" height="80px" />
    </picture>



    <!-- ------------------------------LETTORE MUSICALE------------------------------------- -->
    <!-- -------------VERSIONE MOBILE----------------- -->
    <button v-if="sessione.utente" id="btn_musica" @click="menuMusica = !menuMusica">
      {{ menuMusica ? '❌' : '🎵' }}
    </button>
    <Teleport to="body">
      <div v-if="menuMusica" id="outer_menuMusica" @click.self="menuMusica = !menuMusica">
        <div id="inner_menuMusica" :style="{ '--bg-color': skin.temaPrincipale }">
          <template v-if="playerMusicale.libreria.length > 0">
            <select @change="gestisciCambioTraccia" class="select-traccia">
              <option value="" disabled :selected="!playerMusicale.tracciaAttuale">
                Seleziona un brano...
              </option>
              <option v-for="t in playerMusicale.libreria" :key="t.id_oggetto" :value="t.asset_url">
                🎵 {{ t.nome }}
              </option>
            </select>

            <div class="controlli-player" v-if="playerMusicale.tracciaAttuale">
              <button class="btn-play" @click="playerMusicale.toggle()">
                {{ playerMusicale.inRiproduzione ? '⏸️' : '▶️' }}
              </button>
              <span class="tempo">{{ formattaTempo(playerMusicale.progresso) }}</span>
              <input
                type="range"
                :max="playerMusicale.durata"
                :value="playerMusicale.progresso"
                @input="scorrimentoSlider"
                class="slider-musica"
              />
              <span class="tempo">{{ formattaTempo(playerMusicale.durata) }}</span>
            </div>
          </template>
          <template v-else>
            <span class="testo-no-musica">Nessun brano in libreria</span>
            <button @click="VaiShop" class="btn-shop-musica">🛒 Visita lo Shop</button>
          </template>
        </div>
      </div>
    </Teleport>

     <!-- -------------VERSIONE STANDARD----------------- -->
    <div id="div_player" v-if="sessione.utente">
      <template v-if="playerMusicale.libreria.length > 0">
        <select @change="gestisciCambioTraccia" class="select-traccia">
          <option value="" disabled :selected="!playerMusicale.tracciaAttuale">
            Seleziona un brano...
          </option>
          <option v-for="t in playerMusicale.libreria" :key="t.id_oggetto" :value="t.asset_url">
            🎵 {{ t.nome }}
          </option>
        </select>

        <div class="controlli-player" v-if="playerMusicale.tracciaAttuale">
          <button class="btn-play" @click="playerMusicale.toggle()">
            {{ playerMusicale.inRiproduzione ? '⏸️' : '▶️' }}
          </button>
          <span class="tempo">{{ formattaTempo(playerMusicale.progresso) }}</span>
          <input
            type="range"
            :max="playerMusicale.durata"
            :value="playerMusicale.progresso"
            @input="scorrimentoSlider"
            class="slider-musica"
          />
          <span class="tempo">{{ formattaTempo(playerMusicale.durata) }}</span>
        </div>
      </template>

      <template v-else>
        <span class="testo-no-musica">Nessun brano in libreria</span>
        <button @click="VaiShop" class="btn-shop-musica">🛒 Visita lo Shop</button>
      </template>
    </div>



    <!-- ------------------------------PROFILO E ICONA------------------------------------- -->

    <div v-if="sessione.utente" class="sezione-utente">
      <div id="div_nome_icona" @click="VaiProfilo">
        <label class="icona-profilo">{{ skin.icona }}</label>
        <span class="nome-profilo" >{{ sessione.utente.username }}</span>
      </div>
      <button @click="EseguiLogout" class="btn-header">LOG OUT</button>
    </div>

    <div v-else>
      <button @click="VaiLogin" class="btn-header">ACCEDI / REGISTRATI</button>
    </div>
  
  </div>
</template>

<style scoped>
#main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  font-size: 2.5vh;
  background: linear-gradient(var(--bg-color), color-mix(in srgb, var(--bg-color), black 20%));
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 900;
}

#logo {
  cursor: pointer;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0); /* per fare in modo che se cliccato da mobile non si illumina di blu */
  background-color:  color-mix(in srgb, var(--bg-color), black 20%);
  padding: 5px 10px;
  border-radius: 10px;
}

.sezione-utente {
  display: flex;
  align-items: center;
}

#div_nome_icona {
  margin : 5px 0px 5px;
  padding: 5px 10px;
  border-radius: 10px;
  background-color: color-mix(in srgb, var(--bg-color), white 20%);
  cursor: pointer;
}

.nome-profilo {
  font-weight: bold;
  font-size: 1.2rem;
  color: #333;
}
.icona-profilo {
  font-size: 30px; 
  margin-right: 10px;
}


.btn-header {
  padding: 0.8rem 1.2rem;
  font-size: 16px;
  cursor: pointer;
  margin-left: 15px;
  border: none;
  border-radius: 5px;
  background-color: #333;
  color: white;
}
.btn-header:hover {
  background-color: #555;
}

/* Stili del player musicale */
#div_player {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  padding: 5px 15px;
  border-radius: 8px;
  gap: 5px;
}

.select-traccia {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 4px;
  padding: 3px;
  font-size: 0.9rem;
  width: 250px;
}

.controlli-player {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.btn-play {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  transition: transform 0.1s;
}
.btn-play:hover {
  transform: scale(1.1);
}

.slider-musica {
  flex-grow: 1;
  cursor: pointer;
}

.tempo {
  font-size: 0.8rem;
  color: white;
  font-weight: bold;
  font-family: monospace;
}

.testo-no-musica {
  font-size: 0.8rem;
  color: white;
  opacity: 0.8;
}

.btn-shop-musica {
  background-color: #ffd700;
  color: #333;
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.1s;
}

.btn-shop-musica:hover {
  transform: scale(1.05);
}

/* PER MUSICA MOBILE */
#btn_musica {
  display: none;
  width  : 60px;
  height : 60px;
  border-radius : 10px;
  font-size: 1.5rem;
  border:none;
  background-color: color-mix(in srgb, var(--bg-color),white 90%);
}
#btn_musica:hover {
  background-color: color-mix(in srgb, var(--bg-color),white 75%);
}

#outer_menuMusica {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 700;
}
#inner_menuMusica {
  background-color: var(--bg-color);
  border: 2px solid color-mix(in srgb, var(--bg-color), white 10%);
  padding: 20px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 5px 5px 30px rgb(0, 0, 0);
  width: 85%;
  max-width: 320px;
  z-index: 800;
}
#inner_menuMusica .select-traccia {
  width: 100%;
}


@media only screen and (max-width : 800px){
  #div_player {
    display: none;
  }
  #btn_musica {
    display: block;
  }
  .sezione-utente {
    display: flex;
    flex-direction: column;
  }
  .sezione-utente > * {
    font-size : 12px
  }
  #div_nome_icona {
    margin : 5px 0px 5px;
  }
  .btn-header {
    padding : 6px 15px;
    margin : 5px;
  }
  .nome-profilo {
    display: none;
  }
  .icona-profilo {
    margin : 0;
  }
}
</style>
