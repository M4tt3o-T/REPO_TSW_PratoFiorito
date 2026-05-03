const express = require('express');
const router = express.Router();
const db = require('../db/index');
const auth = require('../middleware/auth');

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

// Rotta per ottenre glo oggetti dell'utente
router.get('/mio', auth, async (req, res) => {
     try {
        const idUser = req.user.id; //Preso dal token

        const query = `
             SELECT n.* FROM inventario i
             JOIN negozio n ON i.id_oggetto = n.id_oggetto
             WHERE i.id_utente = $1
        `;

        const result = await db.query(query, [idUser]);
        res.json({ 
            success: true,
            inventario: result.rows
        });
     } catch (err) {
        res.status(500).json({ success: false, error: "Errore caricamento inventario"})
     }
});

//Rotta per l'acquisto oggetto
router.post('/acquista', auth, async (req, res) => {
     const idUser = req.user.id;
     const {id_oggetto} = req.body;

     try {
        //Inizio transazione
        await db.query('BEGIN'); //Evita che i soldi scalino se l'inserimento fallisce

        //Controlliamo se l'utente ha già l'oggetto
        const inPossesso = await db.query(
            'SELECT 1 FROM inventario WHERE id_utente = $1 AND id_oggetto = $2',
            [idUser, id_oggetto]
        );

        if (inPossesso.rows.length > 0) {
            throw new Error("Possiedi già questo oggetto!");
        }

        //Prendiamo il prezzo dell'oggetto e il saldo dell'utente
        const infoOggetto = await db.query('SELECT prezzo FROM negozio WHERE id_oggetto = $1', [id_oggetto]);
        const infoUser = await db.query('SELECT valuta FROM utenti WHERE id_utente = $1', [idUser]);

        if (infoOggetto.rows.length === 0) throw new Error("Oggetto non trovato");

        const prezzo = infoOggetto.rows[0].prezzo;
        const saldo = infoUser.rows[0].valuta;

        if (saldo < prezzo) {
            throw new Error("Saldo insufficiente!");
        }

        //Scaliamo dal saldo
        await db.query('UPDATE utenti SET valuta = valuta - $1 WHERE id_utente = $2', [prezzo, idUser]);

        //Aggiungiamo all'inventario
        await db.query('INSERT INTO inventario (id_utente, id_oggetto) VALUES ($1, $2)', [idUser, id_oggetto]);

        //Fine transazione
        await db.query('COMMIT');

        res.json({
           success: true,
           message: "Acquisto avvenuto con successo!"
        });

     } catch (err) {
         await db.query('ROLLBACK'); //Ferma tutto se qualcosa va storto
         res.status(400).json({ success: false, error: err.message });
     }

});

module.exports = router;