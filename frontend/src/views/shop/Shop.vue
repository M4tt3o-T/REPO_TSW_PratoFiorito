<script setup>
  import { ref, onMounted, computed} from 'vue'
  import { skin } from "../../ambiente.js"

  const listaOggetti=ref([])
  const listaAcquisti=ref([])   //contiene gli id di tutti gli item acquistati, di tali item non verrà visualizzato il prezzo ma solo "ACQUISTATO"
  const errore = ref(null)

  const temi = computed(() => listaOggetti.value.filter(p => p.tipo === 'tema'));
  const sfondi = computed(() => listaOggetti.value.filter(p => p.tipo === 'sfondo'));
  const icone = computed(() => listaOggetti.value.filter(p => p.tipo === 'icona'));
  
  const caricaOggettiAcquistati = async () => {
    try {
      const response = await fetch("/api/shop/oggetti")   //da cambiare quando ci sarà la api che restituisce gli item acquistati dall'utente (da usare anche nell'inventario)
      if (!response.ok) throw new Error('Errore nel caricamento')
      const dati = await response.json()
      listaAcquisti.value = dati.items.map(item => item.id_oggetto)
      console.log("Oggetti Acquistati caricati correttamente:",listaAcquisti.value)
    } catch (err) {
      errore.value = err.message
      console.error(err)
    }
  }

  const caricaShop = async () => {
    try {
      const response = await fetch('/api/shop/oggetti')
      if (!response.ok) throw new Error('Errore nel caricamento')
      const dati = await response.json()
      listaOggetti.value = dati.items
      console.log("Oggetti caricati correttamente:",listaOggetti.value)
    } catch (err) {
      errore.value = err.message
      console.error(err)
    }
  }

  const effettuaAcquisto = (item) => {

    /*

    TODO: Aggiungere qui logica di acquisto

    */

    //Per testare la visualizzazione di ciò che si è comprato (funzione che verrà spostata dell'inventario)
    //le icone non funzionano perché non sono collegate al profilo
    if(item.tipo=="tema") skin.cambiaTema(item.asset_url);
    else if (item.tipo=="sfondo") skin.cambiaSfondo(item.asset_url);
    else if (item.tipo=="icona") skin.cambiaIcona(item.asset_url);

    listaAcquisti.value.push(item.id_oggetto)    //se l'oggetto è stato acquistato correttamente allora lo aggiunge alla lista di id di item acquistati
    console.log("Oggetto Acquistato:",item)
  }

  onMounted(caricaShop)
  //onMounted(caricaOggettiAcquistati)      //per caricare la lista degli oggetti acquistati (NOTA: al momento carica la lista di tutti gli item)
</script>

<template>
  <div id="main">
    <div id="finestra_shop" class="finestra">

      <div id="div_soldi">
        <label>Saldo disponibile : 10000 💰</label>   <!--da recuperare soldi dell'utente-->
      </div>

      <div id="div_temi">
        <h2>Temi:</h2>
        <div class="riga_oggetti">
          <div v-for="item in temi" :key="item.id" class="slot_oggetto">
            <div class="anteprima" :style="{ backgroundColor: item.asset_url }" @click="effettuaAcquisto(item)"></div>
            <span>{{ item.nome }}</span>
            <span v-if="!listaAcquisti.includes(item.id_oggetto)">💰 {{ item.prezzo }}</span>   <!-- se non è nella listaAcquisti allora ne visualizza il prezzo-->
            <span v-else class="span_acquisto"> Acquistato ✅</span>                                                  <!--altrimenti visualizza che è stato acquistato-->
          </div>
        </div>
      </div>

      <div id="div_sfondi">
        <h2>Sfondi:</h2>
        <div class="riga_oggetti">
          <div v-for="item in sfondi" :key="item.id" class="slot_oggetto">
            <div class="anteprima" :style="{ 
              backgroundImage: `url(${item.asset_url})`, 
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }" @click="effettuaAcquisto(item)"></div>
            <span>{{ item.nome }}</span>
            <span v-if="!listaAcquisti.includes(item.id_oggetto)">💰 {{ item.prezzo }}</span>
            <span v-else class="span_acquisto"> Acquistato ✅</span>
          </div>
        </div>
      </div>

      <div id="div_icone">
        <h2>Icone Profilo:</h2>
        <div class="riga_oggetti">
          <div v-for="item in icone" :key="item.id" class="slot_oggetto">
            <div class="anteprima anteprima_icone" @click="effettuaAcquisto(item)">
              {{ item.asset_url }}
            </div>
            <span>{{ item.nome }}</span>
            <span v-if="!listaAcquisti.includes(item.id_oggetto)">💰 {{ item.prezzo }}</span>
            <span v-else class="span_acquisto"> Acquistato ✅</span>
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

  #div_soldi{
    font-size: large;
    font-weight: bold;
    box-sizing: border-box;
    text-align: right;
    padding: 10px;
    width: 100%;
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

  .span_acquisto{
    font-size: 1.1rem;
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