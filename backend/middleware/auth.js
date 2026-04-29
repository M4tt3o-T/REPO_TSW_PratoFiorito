const jwt = require('jsonwebtoken');

//Nessuna fiducia per il frontend
const authMidWare = (req, res, next) => {
    //Recuperiamo il token dell'header della richiesta
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split('')[1]; //Prende solo la parte che ci interessa
    //Se autHeader non esiste si blocca

    //Se il token non c'è blocchiamo tutto
    if (!token) {
        return res.status(401).json({ error: "Accesso negato. Token mancante"});
    }

    try {
        //Verifichiamo il token usando la chave segreta
        const verifica = jwt.verify(token, process.env.JWT_SECRET);
        
        //Inseriamo i dati in req
        req.user = decoded;
        //Può andare oltre adesso
        next();
    } catch(err) {
        res.status(401).json({ error: "Token non valido o scaduto"});
    }
};

module.exports = authMidWare;