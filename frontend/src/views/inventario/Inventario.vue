<script setup>
  import { ref, onMounted, computed} from 'vue'
  import { skin } from "../../ambiente.js"

  const listaAcquisti=ref([])
  const errore = ref(null)

  const temi = computed(() => listaAcquisti.value.filter(p => p.tipo === 'tema'));
  const sfondi = computed(() => listaAcquisti.value.filter(p => p.tipo === 'sfondo'));
  const icone = computed(() => listaAcquisti.value.filter(p => p.tipo === 'icona'));
  
  const caricaOggettiAcquistati = async () => {
    try {
      const response = await fetch('/api/shop/oggetti')   //da cambiare quando ci sarà la api che restituisce gli item acquistati dall'utente
      if (!response.ok) throw new Error('Errore nel caricamento')
      const dati = await response.json()
      listaAcquisti.value = dati.items
      console.log("Oggetti caricati correttamente:",listaAcquisti.value)
    } catch (err) {
      errore.value = err.message
      console.error(err)
    }
  }

  const attivaOggetto = (item) => {
    if(item.tipo=="tema") skin.cambiaTema(item.asset_url);
    else if (item.tipo=="sfondo") skin.cambiaSfondo(item.asset_url);
    else if (item.tipo=="icona") skin.cambiaIcona(item.asset_url);
    console.log("Oggetto Attivato:",item)
  }

  onMounted(caricaOggettiAcquistati)      //per caricare la lista degli oggetti acquistati (NOTA: al momento carica la lista di tutti gli item)
</script>

<template>
  <div id="main">
    <div id="finestra_shop" class="finestra">

      <div id="div_temi">
        <h2>Temi:</h2>
        <div class="riga_oggetti">
          <div class="slot_oggetto" id="tema_base">
            <div class="anteprima" 
              :style="{ backgroundColor: '#42b9af' }" 
              :class="{'selezionato': skin.temaPrincipale === '#42b9af'}"
              @click="attivaOggetto({id:'tema_base',tipo:'tema',asset_url:'#42b9af'})">
            </div>
            <span>Verde Persiano</span>
            <span>(BASE)</span>
          </div>
          <div v-for="item in temi" :key="item.id" class="slot_oggetto">
            <div class="anteprima" 
            :style="{ backgroundColor: item.asset_url }" 
            :class="{'selezionato': skin.temaPrincipale===item.asset_url}"
            @click="attivaOggetto(item)"></div>
            <span>{{ item.nome }}</span>
          </div>
        </div>
      </div>

      <div id="div_sfondi">
        <h2>Sfondi:</h2>
        <div class="riga_oggetti">
          <div class="slot_oggetto" id="sfondo_base">
            <div class="anteprima" 
              :style="{ 
                backgroundImage: `url('/pattern/sfondo_base.jpg')`, 
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }"
              :class="{'selezionato': skin.sfondoURL.includes('sfondo_base.jpg')}"
              @click="attivaOggetto({id:'sfondo_base',tipo:'sfondo',asset_url:'/pattern/sfondo_base.jpg'})">
            </div>
            <span>Mattoncini Grigi</span>
            <span>(BASE)</span>
          </div>
          <div v-for="item in sfondi" :key="item.id" class="slot_oggetto">
            <div class="anteprima" 
              :style="{ 
                backgroundImage: `url(${item.asset_url})`, 
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }" 
              :class="{'selezionato':skin.sfondoURL.includes(item.asset_url)}"
              @click="attivaOggetto(item)"></div>
            <span>{{ item.nome }}</span>
          </div>
        </div>
      </div>

      <div id="div_icone">
        <h2>Icone Profilo:</h2>
        <div class="riga_oggetti">
          <div class="slot_oggetto" id="icona_base">
            <div class="anteprima anteprima_icone" 
              :class="{'selezionato': skin.icona === '🎭'}"
              @click="attivaOggetto({id:'icona_base',tipo:'icona',asset_url:'🎭'})">
              🎭
            </div>
            <span>Maschere</span>
            <span>(BASE)</span>
          </div>
          <div v-for="item in icone" :key="item.id" class="slot_oggetto">
            <div class="anteprima anteprima_icone" 
              :class="{'selezionato': skin.icona===item.asset_url}"
              @click="attivaOggetto(item)">
              {{ item.asset_url }}
            </div>
            <span>{{ item.nome }}</span>
          </div>
        </div>
      </div>

    </div>   
  </div>
</template>


<style scoped>
  #finestra_shop{
    margin : 5vh 0;
    width: 40%;
    height: 80%;
  }

  #div_temi,#div_sfondi,#div_icone{
    margin : 10px 10px;
    padding : 10px 10px 0 10px;
    border-radius: 5px;
    background-color: color-mix(in srgb, var(--bg-color), white 20%);
  }

  .riga_oggetti {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    scrollbar-color : color-mix(in srgb, var(--bg-color), black 50%) color-mix(in srgb, var(--bg-color), white 20%);
    margin-bottom : 2dvh;
    padding-bottom: 2dvh;
  }

  .slot_oggetto {
    width: 7dvw;
    min-width: 90px;
    display: flex;
    flex-direction: column;
    justify-content: top;
    align-items: center;
    flex-shrink: 0;
    margin-top:10px;
  }
  .anteprima {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    border: 2px solid #ddd;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    
  }

  .anteprima_icone {
    font-size: 200%;
    background-color: #f0f0f0;
    user-select: none;
  }

  .selezionato{
    border: solid green 3px;
  }

  @media only screen and (max-width: 800px) {
    .anteprima{
      width: 40px;
      height: 40px;
    }
    #finestra_shop{
      width: 90%;
    }
    .riga_oggetti{
      font-size: 10px;
      gap:0;
    }
    h2{
      font-size: 16px;
    }
  }
</style>