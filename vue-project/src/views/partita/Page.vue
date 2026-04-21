<script setup>
import { ref } from 'vue';
import { skin } from '../../ambiente.js';
import { gioco } from '../../ambiente.js';

// 1. Creiamo una griglia di test 10x10 localmente
const generaGrigliaTest = (dim) => {
  let temp = [];
  for (let y = 0; y < dim; y++) {
    let riga = [];
    for (let x = 0; x < dim; x++) {
      riga.push({});
    }
    temp.push(riga);
  }
  return temp;
};

const griglia = ref(generaGrigliaTest(gioco.dimensione_grid));

// Funzione per testare il click senza server
const scropriCella = (x, y) => {
  griglia.value[y][x].isRevealed = true;
};
</script>

<template>
  <div id="main">

    <div id="zonaPartita">
      <div class="grid-container">
      <div v-for="(riga, y) in griglia" :key="'riga-'+y" class="riga-flex">
        <div 
            v-for="(cella, x) in riga" 
            :key="'cella-'+x"
            class="cella"
            :class="{ 'scoperta': cella.isRevealed }"
            @click="scropriCella(x, y)"
          >
            
          </div>
        </div>
      </div>

      <div id="giocatori">
        <div v-for="player in gioco.lista_giocatori" class="player">
          {{player}}
        </div>
      </div>

      <div id="div_pulsanti">
        <button class="pulsanti">🧹</button>
        <button class="pulsanti">🚩</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
#zonaPartita{
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: auto auto;
  width:40rem;
  padding:1rem;
  background-color: v-bind('skin.temaPrincipale');
}
#giocatori{
  font-size:25px;
  margin:3%;
}
.player{
  margin-bottom:4%;
}
#div_pulsanti{
  display: flex;
  justify-content: center;
  align-items: center;
  gap:5%
}
.pulsanti{
  padding:2%;
  font-size: 1.3rem;
}
.grid-container {
  /* Usiamo il colore dello store per il bordo della griglia */
  border: 5px solid v-bind('skin.temaPrincipale');
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.8); /* Sfondo semi-trasparente */
  border-radius: 8px;
}

.riga-flex {
  display: flex; /* Mette le celle una accanto all'altra */
}

.cella {
  width: 40px;
  height: 40px;
  border: 1px solid #999;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  background-color: #bbb; /* Colore cella coperta */
  font-weight: bold;
  user-select: none;
}

.cella.scoperta {
  background-color: #eee; /* Colore cella scoperta */
}

.cella:hover {
  filter: brightness(1.1); /* Effetto hover semplice */
}
</style>