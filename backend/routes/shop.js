const express = require('express');
const router = express.Router();
const db = require('../db/index');

// Rotta per ottenere tutti gli oggetti del negozio
router.get('/oggetti', async (req, res) => {
    try {
        const query = `
            SELECT id_oggetto, nome, descrizione, tipo, prezzo, asset_url 
            FROM negozio 
            ORDER BY tipo ASC, prezzo ASC
        `;
        
        const result = await db.query(query);
        
        // Restituiamo i dati al frontend
        res.json({ 
            success: true, 
            items: result.rows 
        });

    } catch (err) {
        console.error("Errore durante il recupero degli oggetti dello shop:", err);
        res.status(500).json({ success: false, message: "Errore interno del server durante il caricamento dello shop" });
    }
});

module.exports = router;