const express = require('express');
const router = express.Router();
const db = require('../db/index');
const auth = require('../middleware/auth'); 

//Classifca GLOBALE
router.get('/classifica', async (req, res) => {
      try {
         const query = `
         SELECT username, valuta
         FROM utenti
         ORDER BY valuta DESC
         LIMIT 10
         `;
         const
      } catch (err) {
          console.error(err);
          res.status(500).json({ success: false, error: "Errore nel recupero della classfica"});
      }
});

//Statistiche PERSONALI
//Usiamo il middleware perché dobbiamo sapere chi è
router.get('/me', auth, async (req, res) => {
    try {
        //l'id viene estratto dal token
        const query = `
           SELECT username, email, valuta,
           (SELECT COUNT(*) FROM partite WHERE id_vincitore = $1) as vittorie_totali
           FROM utenti
           WHERE id_utente = $1
        `;

        const result = await db.query(query, [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Utente non trovato"});
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Errore nel recupero del profilo"});
    }
});

module.exports = router;