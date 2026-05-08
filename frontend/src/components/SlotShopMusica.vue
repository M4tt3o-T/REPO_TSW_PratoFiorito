<script setup>
// Riceviamo anche inProva per sapere se questa canzone sta suonando ora
const props = defineProps(['item', 'listaAcquisti', 'inProva'])
const emits = defineEmits(['acquisto', 'prova'])
</script>

<template>
  <div :key="item.id" class="slot_oggetto">
    <div class="anteprima anteprima_musica">🎵</div>
    <span>{{ item.nome }}</span>

    <div class="azioni-item" v-if="!listaAcquisti.includes(item.id_oggetto)">
      <button class="btn-prova" @click="$emit('prova', item)">
        {{ inProva.musica === item.id_oggetto ? '⏹️ Stop' : '▶️ Ascolta 10s' }}
      </button>
      <button class="btn-compra" @click="$emit('acquisto', item)">💰 {{ item.prezzo }}</button>
    </div>

    <div class="azioni-item" v-else>
      <button class="btn-prova" @click="$emit('prova', item)">
        {{ inProva.musica === item.id_oggetto ? '⏹️ Stop' : '▶️ Ascolta 10s' }}
      </button>
      <span class="span_acquisto">Acquistato ✅</span>
    </div>
  </div>
</template>

<style scoped>
@import './style_shop.css';

.anteprima_musica {
  font-size: 250%;
  background: linear-gradient(135deg, #1db954, #191414);
  color: white;
  user-select: none;
}
</style>
