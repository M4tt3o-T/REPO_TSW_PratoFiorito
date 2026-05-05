<script setup>
  import { ref, onMounted, onUnmounted, computed, reactive } from 'vue'
  import { skin, sessione, notifica } from "../../ambiente.js"
  const API_URL = import.meta.env.VITE_SOCKET_URL;

  const listaOggetti=ref([])
  const listaAcquisti=ref([])   //contiene gli id di tutti gli item acquistati, di tali item non verrà visualizzato il prezzo ma solo "ACQUISTATO"
  const errore = ref(null)

  const temi = computed(() => listaOggetti.value.filter(p => p.tipo === 'tema'));
  const sfondi = computed(() => listaOggetti.value.filter(p => p.tipo === 'sfondo'));
  const icone = computed(() => listaOggetti.value.filter(p => p.tipo === 'icona'));
  
  // Inizializziamo lo stato originale dell'utente
  const statoOriginale = reactive({
    tema: skin.temaPrincipale,
    sfondo: skin.sfondoURL,
    icona: skin.icona
  });

  // Teniamo traccia di cosa sta provando l'utente
  const inProva = reactive({
    tema: null,
    sfondo: null,
    icona: null
  });

  const caricaOggettiAcquistati = async () => {
    try {
      // Recuperiamo il token di sicurezza dal disco
      const token = localStorage.getItem('token_campo_minato');
      if (!token) return;

      // Chiamiamo la rotta corretta passando il token nell'intestazione
      const response = await fetch(`${API_URL}/api/shop/mio`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Errore nel caricamento inventario');
      
      const dati = await response.json();
      
      // Il server ci risponde con un array "inventario"
      listaAcquisti.value = dati.inventario.map(item => item.id_oggetto);
      console.log("Oggetti Acquistati caricati correttamente:", listaAcquisti.value);
    } catch (err) {
      errore.value = err.message;
      console.error(err);
    }
  }

  const caricaShop = async () => {
    try {
      const response = await fetch(`${API_URL}/api/shop/oggetti`)
      if (!response.ok) throw new Error('Errore nel caricamento shop')
      const dati = await response.json()
      listaOggetti.value = dati.items
      console.log("Oggetti caricati correttamente:", listaOggetti.value)
    } catch (err) {
      errore.value = err.message
      console.error(err)
    }
  }

  const aggiornaSaldo = async () => {
    try {
      const token = localStorage.getItem('token_campo_minato');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/stats/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const dati = await response.json();
        
        // Aggiorniamo la valuta in memoria con quella fresca del DB
        sessione.utente.valuta = dati.user.valuta;
        
        // Salviamo il dato aggiornato sul disco fisso per non perderlo
        sessione.setUtente(sessione.utente);
      }
    } catch (err) {
      console.error("Impossibile aggiornare il saldo:", err);
    }
  }

  // Logica di prova e ripristino
  const gestisciProva = (item) => {
    // Se stavamo già provando questo oggetto, lo ripristiniamo
    if (inProva[item.tipo] === item.id_oggetto) {
      ripristina(item.tipo);
    } else {
      // Altrimenti lo proviamo e salviamo l'ID
      inProva[item.tipo] = item.id_oggetto;
      if (item.tipo == "tema") skin.cambiaTema(item.asset_url);
      else if (item.tipo == "sfondo") skin.cambiaSfondo(`url('${item.asset_url}')`);
      else if (item.tipo == "icona") skin.cambiaIcona(item.asset_url);
    }
  }

  const ripristina = (tipo) => {
    inProva[tipo] = null; // Rimuoviamo lo stato di prova
    if (tipo === 'tema') skin.cambiaTema(statoOriginale.tema);
    if (tipo === 'sfondo') skin.cambiaSfondo(statoOriginale.sfondo);
    if (tipo === 'icona') skin.cambiaIcona(statoOriginale.icona);
  }

  // Logica per equipaggiare un oggetto già posseduto o appena acquistato
  const equipaggiaOggetto = (item) => {
    if (item.tipo == "tema") {
      skin.cambiaTema(item.asset_url);
      statoOriginale.tema = item.asset_url;
    } else if (item.tipo == "sfondo") {
      skin.cambiaSfondo(`url('${item.asset_url}')`);
      statoOriginale.sfondo = `url('${item.asset_url}')`;
    } else if (item.tipo == "icona") {
      skin.cambiaIcona(item.asset_url);
      statoOriginale.icona = item.asset_url;
    }
    inProva[item.tipo] = null;
    notifica.mostra("Oggetto equipaggiato!");
  }

  const effettuaAcquisto = async (item) => {
    // Controllo di sicurezza rapido lato Client
    if (sessione.utente.valuta < item.prezzo) {
        notifica.mostra("Non hai abbastanza monete per acquistare questo oggetto!");
        return;
    }

    try {
        const token = localStorage.getItem('token_campo_minato');
        
        // Chiamata POST al database
        const response = await fetch(`${API_URL}/api/shop/acquista`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id_oggetto: item.id_oggetto })
        });

        const dati = await response.json();

        if (response.ok) {
            // L'acquisto è andato a buon fine nel DB
            
            // Aggiungiamo l'oggetto alla lista 
            listaAcquisti.value.push(item.id_oggetto);
            
            // Scaliamo i soldi in tempo reale dalla UI e salviamo in locale
            sessione.utente.valuta -= item.prezzo;
            sessione.setUtente(sessione.utente); 

            // Equipaggiamo subito l'oggetto
            equipaggiaOggetto(item);

            notifica.mostra("Acquisto completato con successo!");
        } else {
            // Se il server ha bloccato l'acquisto
            notifica.mostra(dati.error || "Errore durante l'acquisto.");
        }
    } catch (err) {
        console.error("Errore di rete durante l'acquisto:", err);
        notifica.mostra("Impossibile contattare il server.");
    }
  }

  // Carichiamo tutto all'avvio
  onUnmounted(() => {
    // Se qualcosa era rimasto in prova, ripristiniamo la fotografia originale
    if (inProva.tema) ripristina('tema');
    if (inProva.sfondo) ripristina('sfondo');
    if (inProva.icona) ripristina('icona');
  });

  onMounted(() => {
      caricaShop();
      if (sessione.utente) {
          caricaOggettiAcquistati();
          aggiornaSaldo();
      }
  });
</script>

<template>
  <div id="main">
    <div id="finestra_shop" class="finestra">

      <div id="div_soldi">
        <!-- Controlla se l'utente esiste, altrimenti mostra 0 -->
        <label>Saldo disponibile : {{ sessione.utente ? sessione.utente.valuta : 0 }} 💰</label>
      </div>

      <div id="div_temi">
        <h2>Temi:</h2>
        <div class="riga_oggetti">
          <div v-for="item in temi" :key="item.id" class="slot_oggetto">
            <div class="anteprima" :style="{ backgroundColor: item.asset_url }"></div>
            <span>{{ item.nome }}</span>
            
            <!-- Se non è acquistato: Mostra Prova e Acquista -->
            <div class="azioni-item" v-if="!listaAcquisti.includes(item.id_oggetto)">
              <!-- Il testo cambia se stiamo provando questo specifico id_oggetto -->
              <button 
                 class="btn-prova" 
                 @click="gestisciProva(item)">
                {{ inProva.tema === item.id_oggetto ? '↩️ Ripristina' : '👁️ Prova' }}
              </button>
              <button class="btn-compra" @click="effettuaAcquisto(item)">💰 {{ item.prezzo }}</button>
            </div>
            
            <!-- Se è già acquistato -->
            <div class="azioni-item" v-else>
              <button class="btn-prova" @click="equipaggiaOggetto(item)">✨ Equipaggia</button>
              <span class="span_acquisto">Acquistato ✅</span>
            </div>
            
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
            }"></div>
            <span>{{ item.nome }}</span>
            
            <!-- Se non è acquistato: Mostra Prova e Acquista -->
            <div class="azioni-item" v-if="!listaAcquisti.includes(item.id_oggetto)">
              <!-- Il testo cambia se stiamo provando questo specifico id_oggetto -->
              <button 
                 class="btn-prova" 
                 @click="gestisciProva(item)">
                {{ inProva.sfondo === item.id_oggetto ? '↩️ Ripristina' : '👁️ Prova' }}
              </button>
              <button class="btn-compra" @click="effettuaAcquisto(item)">💰 {{ item.prezzo }}</button>
            </div>
            
            <!-- Se è già acquistato -->
            <div class="azioni-item" v-else>
              <button class="btn-prova" @click="equipaggiaOggetto(item)">✨ Equipaggia</button>
              <span class="span_acquisto">Acquistato ✅</span>
            </div>
            
          </div>
        </div>
      </div>

      <div id="div_icone">
        <h2>Icone:</h2>
        <div class="riga_oggetti">
          <div v-for="item in icone" :key="item.id" class="slot_oggetto">
            <div class="anteprima anteprima_icone">
              {{ item.asset_url }}
            </div>
            <span>{{ item.nome }}</span>
            
            <!-- Se non è acquistato: Mostra Prova e Acquista -->
            <div class="azioni-item" v-if="!listaAcquisti.includes(item.id_oggetto)">
              <!-- Il testo cambia se stiamo provando questo specifico id_oggetto -->
              <button 
                 class="btn-prova" 
                 @click="gestisciProva(item)">
                {{ inProva.icona === item.id_oggetto ? '↩️ Ripristina' : '👁️ Prova' }}
              </button>
              <button class="btn-compra" @click="effettuaAcquisto(item)">💰 {{ item.prezzo }}</button>
            </div>
            
            <!-- Se è già acquistato -->
            <div class="azioni-item" v-else>
              <button class="btn-prova" @click="equipaggiaOggetto(item)">✨ Equipaggia</button>
              <span class="span_acquisto">Acquistato ✅</span>
            </div>
            
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
    gap: 15px;
    overflow-x: auto;
    align-items: stretch;
    scrollbar-color : color-mix(in srgb, var(--bg-color), black 50%) color-mix(in srgb, var(--bg-color), white 20%);
    margin-bottom : 2dvh;
    padding-bottom: 2dvh;
  }

  .slot_oggetto {
    width: 7dvw;
    min-width: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    margin-top:10px;
    height: auto;
  }

  .slot_oggetto > span {
    text-align: center;
    font-size: 0.95rem;
    margin-bottom: 8px;
    line-height: 1.2;
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

  .azioni-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: auto;
    width: 100%;
    align-items: center;
  }

  .btn-prova {
    background-color: #ddd;
    color: #333;
    border: none;
    padding: 6px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    width: 90%;
    transition: background-color 0.2s;
  }

  .btn-prova:hover {
    background-color: #ccc;
  }

  .btn-compra {
    background-color: #ffd700;
    color: #333;
    border: none;
    padding: 6px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    font-size: 0.9rem;
    width: 90%;
    transition: transform 0.1s;
  }

  .btn-compra:hover {
    transform: scale(1.05);
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