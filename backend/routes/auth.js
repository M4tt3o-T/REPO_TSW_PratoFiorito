const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); //per maggiore sicurezza
const jwt = require('jsonwebtoken'); //invece dei cookie
const db = require('../db/index'); //ponte al db

//REGISTRAZIONE
router.post('/signup', async (req, res) => {
    const {username, email, password} = req.body;

    //Validazione
    if (!username || !email || !password) {
        return res.status(400).json({error: "Tutti i campi sono obbligatori"});
    }
    if (password.lenght < 8) {
        return res.status(400).json({error: "La password deve contenere almeno 8 caratteri"});
    }

    try {
        //Cryptiamo la password
        const sale = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, sale);

        //Inserimao nel DB
        const query = `
            INSERT INTO utenti (username, email, hashword, valuta) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id_utente, username, email
        `;
        
        const result = await db.query(query, [username, email, hash, 0]);

        const newUser = result.rows[0];

        //Generiamo il token 
        const token = jwt.sign({id: newUser.id_utente}, process.env.JWT_SECRET, { expiresIn: '24h'});

        res.status(201).json({ message: "Registrazione riuscita", token, user: newUser});

    } catch (err) {
        if (err.code === '23505') { //Errore Chiave Duplicata di Postgres
            return res.status(400).json({ error: "Email o Username già esistenti"});
        }
        console.error(err);
        res.status(500).json({error: "Errore interno del server"});
    }
});

//LOGIN
router.post('/login', async (req, res) => {
     const {email, password} = req.body;

     try {
        //Cerchiamo l'utente
        const result = await db.query('SELECT * FROM utenti WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({error: "Credenziali non valide"});
        
        //Confrontiamo la password
        const giusto = await bcrypt.compare(password, user.hashword);
        if (!giusto) return res.status(401).json({error: "Credenziali non valide"});

        //Generiamo il token
        const token = jwt.sign({ id: user.id_utente}, process.env.JWT_SECRET, { expiresIn: '24h'});

        res.json({
            token,
            user: {id: user.id_utente, username: user.username, email: user.email, valuta: user.valuta}
        });
     } catch (err) {
        res.status(500).json({error: "Errore nel login"});
     }
});

module.exports = router;
//app.use(express.json()); // Per leggere req.body
//const authRoutes = require('./routes/auth');
//app.use('/api/auth', authRoutes);