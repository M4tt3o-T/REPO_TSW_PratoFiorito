<script setup>
    defineProps(['messaggio'])
    defineEmits(['riprova'])
</script>

<template>
    <div id="div_errore">
        <div id="div_icona_messaggio" class="finestra">
            <span id="icona_errore">⚠️</span>
            <h3>Si è verificato un problema</h3>
            <span>"{{ messaggio }}"</span>
            <button @click="$emit('riprova')" id="bottone_riprova">Riprova</button>
        </div>
    </div>
  
</template>

<style scoped>
    #div_errore {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    #div_icona_messaggio {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 10px 40px 30px;
        height:160px;
        overflow: hidden;
    }
    #icona_errore { font-size: 3rem; }
    #bottone_riprova {
        margin-top: 20px;
        padding: 10px 30px;
        background-color: #ffcc00;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
    }
</style>