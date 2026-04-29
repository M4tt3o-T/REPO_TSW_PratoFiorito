const db = require('./db/index');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bcrypt = require('bcrypt'); // Libreria per la sicurezza delle password
const cors = require('cors')

// Importiamo il motore di gioco
const gameLogic = require('./game_logic'); 

const app = express();

const corsOptions = {
    origin: ['https://minesweepermmo.netlify.app', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Aggiungiamo esplicitamente OPTIONS
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'] // Necessario se invii JSON!
};

const server = http.createServer(app);

app.use(cors(corsOptions));
app.options('/(.*)', cors(corsOptions));
// Permette a express di leggere il corpo delle richieste POST (JSON)
app.use(express.json());
// Dice a Express di servire i file della cartella frontend
app.use(express.static(path.join(__dirname, '../frontend')));

const io = new Server(server, {
  cors: corsOptions
});

// --- ROTTE DI AUTENTICAZIONE (HTTP) ---

// 1. Registrazione (Signup)
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // Criptiamo la password prima di salvarla
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    const result = await db.query(
      'INSERT INTO utenti (username, email, hashword) VALUES ($1, $2, $3) RETURNING id_utente, username',
      [username, email, hash]
    );
    
    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Errore di duplicato (Unique constraint)
      res.status(400).json({ success: false, message: "Username o Email già esistenti" });
    } else {
      res.status(500).json({ success: false, message: "Errore durante la registrazione" });
    }
  }
});

// 2. Accesso (Login)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM utenti WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Utente non trovato" });
    }

    const utente = result.rows[0];
    // Confrontiamo la password digitata con quella criptata nel DB
    const match = await bcrypt.compare(password, utente.hashword);

    if (match) {
      res.json({ 
        success: true, 
        user: { id_utente: utente.id_utente, username: utente.username } 
      });
    } else {
      res.status(401).json({ success: false, message: "Password errata" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Errore durante il login" });
  }
});

// --- LOGICA SOCKET.IO (GIOCO) ---

// Questa variabile terrà in memoria (RAM) lo stato di tutte le partite in corso.
const activeGames = {}; 

// Quando un nuovo client si connette al server
io.on('connection', (socket) => {
  console.log(`Nuovo giocatore connesso! ID: ${socket.id}`);

  // 1. L'utente chiede di entrare/creare una partita
  socket.on('unisciti_partita', async (dati) => {
      const { idPartita, username, idUtente, azione } = dati;

      // Variabile per contenere l'UUID reale della partita (ci serve per gioca_in)
      let uuidPartita = null;

      if (!idUtente) {
          socket.emit('errore_accesso', 'Devi essere loggato per giocare!');
          return;
      }
      
      // --- CASO A: L'utente vuole UNIRSI a una partita ---
      if (azione === 'unisciti') {
          if (!activeGames[idPartita]) {
              // La partita non è in RAM, ripristiniamo dal DB
              try {
                  const res = await db.query('SELECT * FROM partite WHERE chiave_accesso = $1', [idPartita]);

                  if (res.rows.length > 0) {
                      const p = res.rows[0];

                      // Se la partita è già finita, mostriamo lo storico!
                      if (p.stato !== 'in_corso') {
                          try {
                              const resClassifica = await db.query(`
                                  SELECT u.username, COALESCE(g.punteggio_partita, 0) as punti
                                  FROM gioca_in g
                                  JOIN utenti u ON g.id_utente = u.id_utente
                                  WHERE g.id_partita = $1
                                  ORDER BY punti DESC
                              `, [p.id_partita]);

                              // Inviamo un evento diretto solo a chi ha richiesto l'accesso
                              socket.emit('partita_terminata', {
                                  esito: p.stato, // Sarà 'vinta' o 'persa'
                                  griglia: p.mappa_config,
                                  classifica: resClassifica.rows,
                                  storico: true // Flag utile al frontend per sapere che sta solo guardando
                              });
                              return; // Fermiamo l'esecuzione, non lo facciamo entrare nella stanza
                          } catch (err) {
                              console.error("Errore recupero storico:", err);
                          }
                      } else {
                          uuidPartita = p.id_partita; // Salviamo l'UUID
                          const percRipristinata = (p.numero_mine / (p.larghezza * p.altezza)) * 100;

                          activeGames[idPartita] = {
                              uuid: p.id_partita,
                              size: p.larghezza,
                              moltiplicatore: percRipristinata / 10,
                              celleScoperte: p.mappa_config ? gameLogic.contaCelleScoperte(p.mappa_config) : 0,
                              grid: p.mappa_config || gameLogic.generateEmptyGrid(p.larghezza, p.altezza),
                              totalMines: p.numero_mine,
                              isFirstClick: p.is_first_click,
                              giocatori: [],
                              messaggi: []
                          };
                          console.log(`Partita ${idPartita} ripristinata dal DB in RAM`);
                      }
                  } else {
                      socket.emit('errore_accesso', 'Errore: La stanza non esiste o è terminata.');
                      return;
                  }
              } catch (err) {
                  console.error("Errore ripristino partita:", err);
                  return;
              }
          } else {
              // La partita È in RAM ma ci serve comunque l'UUID per registrarci in gioca_in
              try {
                  const resUUID = await db.query('SELECT id_partita FROM partite WHERE chiave_accesso = $1', [idPartita]);
                  uuidPartita = resUUID.rows[0].id_partita;
              } catch (err) {
                  console.error("Errore recupero UUID per partita in RAM:", err);
              }
          }

          // Ora che abbiamo sicuramente l'UUID (in un modo o nell'altro), leghiamo il PLAYER
          if (uuidPartita) {
              try {
                  await db.query(
                      'INSERT INTO gioca_in (id_partita, id_utente, ruolo) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                      [uuidPartita, idUtente, 'player']
                  );
              } catch (err) {
                  console.error("Errore registrazione player in gioca_in:", err);
              }
          }
      } 
      
      // --- CASO B: L'utente vuole CREARE una nuova partita ---
      else if (azione === 'crea') {
          if (!activeGames[idPartita]) {
              const size = parseInt(dati.dimensione) || 10;
              const perc = parseInt(dati.difficolta) || 10;
              const mineTotali = Math.floor((size * size) * (perc / 100));
              const moltiplicatoreDifficolta = perc / 10;

              try {
                  // 1. Creiamo la partita e recuperiamo l'UUID
                  const resPartita = await db.query(
                      'INSERT INTO partite (chiave_accesso, larghezza, altezza, numero_mine, stato, is_first_click) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_partita',
                      [idPartita, size, size, mineTotali, 'in_corso', true]
                  );
                  
                  const uuidVero = resPartita.rows[0].id_partita;

                  // 2. Leghiamo l'HOST
                  await db.query(
                      'INSERT INTO gioca_in (id_partita, id_utente, ruolo) VALUES ($1, $2, $3)',
                      [uuidVero, idUtente, 'host']
                  );

                  activeGames[idPartita] = {
                      uuid: uuidVero, // Salviamo l'UUID per usarlo nelle query dei punti!
                      size: size,
                      moltiplicatore: moltiplicatoreDifficolta,
                      celleScoperte: 0,
                      grid: gameLogic.generateEmptyGrid(size, size),
                      totalMines: mineTotali,
                      isFirstClick: true,
                      giocatori: [],
                      messaggi: []
                  };

              } catch (err) {
                  console.error("Errore salvataggio partita/host nel DB:", err);
              }
          }
      }

      // --- Accesso alla stanza Socket e aggiornamento UI ---
      socket.join(idPartita);
      console.log(`${username} è entrato nella partita ${idPartita}`);
      
      // Evitiamo di inserire cloni nell'array della RAM
      if (!activeGames[idPartita].giocatori.includes(username)) {
          activeGames[idPartita].giocatori.push(username);
      }
      
      io.to(idPartita).emit('messaggio_sistema', `${username} si è unito alla partita!`);
      socket.emit('aggiorna_griglia', activeGames[idPartita].grid);
      socket.emit('storico_chat', activeGames[idPartita].messaggi);
  });

  // 2. Il client invia una mossa
  socket.on('mossa_utente', async (dati) => {
    const { idPartita, x, y, azione } = dati;
    const partita = activeGames[idPartita];
    let clickIniziale = false;

    // Se la partita non esiste, ignoriamo la mossa
    if (!partita) return; 

    // A. È il primo click in assoluto? Generiamo le mine
    if (azione === 'scopri' && partita.isFirstClick) {
      // 1. Controllo di sicurezza sul DB per evitare sovrascritture
      try {
        const res = await db.query('SELECT is_first_click FROM partite WHERE chiave_accesso = $1', [idPartita]);
        
        // Se is_first_click è già false sul DB, significa che un altro giocatore ha già cliccato
        if (res.rows.length > 0 && res.rows[0].is_first_click === false) {
          partita.isFirstClick = false; 
          // Recuperiamo la mappa che è già stata generata dall'altro giocatore
          const resMappa = await db.query('SELECT mappa_config FROM partite WHERE chiave_accesso = $1', [idPartita]);
          partita.grid = resMappa.rows[0].mappa_config;
        } else {
          clickIniziale = true;
          // Procediamo con la generazione
          gameLogic.placeMines(partita.grid, partita.totalMines, x, y);
          gameLogic.calculateNumbers(partita.grid);
          partita.isFirstClick = false;

          // 2. Aggiorniamo il DB: salviamo la mappa e "chiudiamo" il primo click
          await db.query(
            'UPDATE partite SET mappa_config = $1, is_first_click = $2 WHERE chiave_accesso = $3',
            [JSON.stringify(partita.grid), false, idPartita]
          );
        }
      } catch (err) {
        console.error("Errore durante il controllo del primo click:", err);
        return;
      }
    }

    // B. Applichiamo la mossa
    if (azione === 'bandierina') {
      gameLogic.toggleFlag(partita.grid, x, y);
    } else if (azione === 'scopri') {
      // Ha cliccato una mina?
      if (partita.grid[y][x].isMine) {
        // Sveliamo tutte le mine sulla griglia
        gameLogic.revealAllMines(partita.grid);
        // -- AGGIORNAMENTO STATO "PERSA" NEL DB --
        try {
            // Nessun bonus, trasferiamo semplicemente i punti accumulati fino a quel momento
            await db.query(`
                UPDATE utenti 
                SET valuta = valuta + COALESCE(g.punteggio_partita, 0)
                FROM gioca_in g
                WHERE utenti.id_utente = g.id_utente AND g.id_partita = $1
            `, [partita.uuid]);

            await db.query(
                'UPDATE partite SET stato = $1, data_fine = NOW(), mappa_config = $2 WHERE id_partita = $3',
                ['persa', JSON.stringify(partita.grid), partita.uuid]
            );

            // Recuperiamo la classifica della partita appena finita
            const resClassifica = await db.query(`
                SELECT u.username, COALESCE(g.punteggio_partita, 0) as punti
                FROM gioca_in g
                JOIN utenti u ON g.id_utente = u.id_utente
                WHERE g.id_partita = $1
                ORDER BY punti DESC
            `, [partita.uuid]);

            // Inviamo l'evento con i dati completi
            io.to(idPartita).emit('partita_terminata', { 
                esito: 'sconfitta', 
                griglia: partita.grid,
                classifica: resClassifica.rows // Array con i giocatori ordinati
            });
        } catch (err) {
            console.error("Errore fine partita Sconfitta:", err);
        }

        delete activeGames[idPartita];
        return;
      } else {
          // 1. Contiamo prima della mossa
          const cellePrima = gameLogic.contaCelleScoperte(partita.grid);
          
          // 2. Eseguiamo il flood-fill
          gameLogic.revealCell(partita.grid, x, y);
          
          // 3. Contiamo dopo la mossa
          const celleDopo = gameLogic.contaCelleScoperte(partita.grid);
          const nuoveScoperte = celleDopo - cellePrima;

          // 4. Calcolo Punteggio
          if (nuoveScoperte > 0) {
              let puntiGuadagnati = 0;
              for (let i = 1; i <= nuoveScoperte; i++) {
                  partita.celleScoperte++;
                  if (!clickIniziale){
                      puntiGuadagnati += Math.sqrt(partita.celleScoperte) * partita.moltiplicatore;
                  }
              }
              
              // Arrotondiamo per non avere decimali nel DB
              puntiGuadagnati = Math.round(puntiGuadagnati);
              // -- AGGIORNAMENTO DB: Sommiamo i punti nella tabella gioca_in --
              if (puntiGuadagnati > 0){
                  try {
                      await db.query(
                          'UPDATE gioca_in SET punteggio_partita = COALESCE(punteggio_partita, 0) + $1 WHERE id_partita = $2 AND id_utente = $3',
                          [puntiGuadagnati, partita.uuid, dati.idUtente]
                      );
                  } catch (err) {
                      console.error("Errore salvataggio punti mossa:", err);
                  }
              }
          }
      }
    }

    // C. Controlliamo se questa mossa lo ha fatto vincere
    if (gameLogic.checkWin(partita.grid, partita.totalMines)) {
      const bonusVittoria = Math.round(partita.size * partita.size * partita.moltiplicatore);
      // --Operazione DB: Chiudiamo la partita
      try {
          // 1. Diamo il bonus a TUTTI i giocatori della partita
          await db.query(
              'UPDATE gioca_in SET punteggio_partita = COALESCE(punteggio_partita, 0) + $1 WHERE id_partita = $2',
              [bonusVittoria, partita.uuid]
          );

          // 2. Versiamo i punti finali di questa partita nei portafogli degli utenti
          await db.query(`
              UPDATE utenti 
              SET valuta = valuta + COALESCE(g.punteggio_partita, 0)
              FROM gioca_in g
              WHERE utenti.id_utente = g.id_utente AND g.id_partita = $1
          `, [partita.uuid]);

          // 3. Chiudiamo la partita
          await db.query(
              'UPDATE partite SET stato = $1, data_fine = NOW(), mappa_config = $2 WHERE id_partita = $3',
              ['vinta', JSON.stringify(partita.grid), partita.uuid]
          );

          // Recuperiamo la classifica della partita appena finita
            const resClassifica = await db.query(`
                SELECT u.username, COALESCE(g.punteggio_partita, 0) as punti
                FROM gioca_in g
                JOIN utenti u ON g.id_utente = u.id_utente
                WHERE g.id_partita = $1
                ORDER BY punti DESC
            `, [partita.uuid]);

            // Inviamo l'evento con i dati completi
            io.to(idPartita).emit('partita_terminata', { 
                esito: 'vittoria', 
                griglia: partita.grid,
                classifica: resClassifica.rows,
                bonus: bonusVittoria
            });
      } catch (err) {
          console.error("Errore fine partita Vittoria:", err);
      }

      delete activeGames[idPartita]; // Puliamo la RAM
      return;
    }

    // D. Salva lo stato attuale della griglia nel DB
    try {
        await db.query(
            'UPDATE partite SET mappa_config = $1 WHERE chiave_accesso = $2',
            [JSON.stringify(partita.grid), idPartita]
        );
    } catch (err) {
        console.error("Errore salvataggio progresso mossa:", err);
    }

    // E. Se il gioco continua, invia la griglia aggiornata a tutta la stanza
    io.to(idPartita).emit('aggiorna_griglia', partita.grid);
  });

  // Gestione della Chat
  socket.on('invia_messaggio_chat', async (dati) => {
    const { idPartita, idUtente, username, testo } = dati;
    
    if (activeGames[idPartita]) {
      // Creiamo l'oggetto messaggio (proprio come fosse una riga del database)
      const nuovoMessaggio = {
        autore: username,
        testo: testo,
        ora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) // Es. "14:30"
      };

      //--Operazione DB: Salviamo  nella tabella messaggi olte che nella RAM
      try {
        //Recuperiamo l'uuid della partita tramite il campo 'chiave_accesso'
        const resPartita = await db.query('SELECT id_partita FROM partite  WHERE chiave_accesso = $1', [idPartita]);
        if (resPartita.rows.length > 0) {
          const uuidPartita = resPartita.rows[0].id_partita;
          await db.query(
            'INSERT INTO messaggi (id_partita, id_utente, testo) VALUES ($1, $2, $3)',
            [uuidPartita, idUtente, testo]
          );
        }
      } catch (err) {
        console.error("Errore salvataggio messaggio:", err);
      }

      // 1. Lo salviamo nel placeholder in RAM
      activeGames[idPartita].messaggi.push(nuovoMessaggio);

      // 2. Lo spediamo a tutti i presenti nella stanza (compreso chi lo ha inviato)
      io.to(idPartita).emit('nuovo_messaggio_chat', nuovoMessaggio);
    }
  });

  // Gestione della disconnessione
  socket.on('disconnect', () => {
    console.log(`Giocatore disconnesso: ${socket.id}`);
    // Qui andrà aggiunta la logica per rimuovere l'utente dalla partita
  });

  // Gestione richiesta storico personale
  socket.on('richiedi_storico', async (idUtente) => {
      if (!idUtente) return;

      try {
          const res = await db.query(`
              SELECT 
                  p.chiave_accesso, 
                  p.stato, 
                  p.data_creazione, 
                  p.larghezza, 
                  p.numero_mine, 
                  COALESCE(g.punteggio_partita, 0) as punti
              FROM partite p
              JOIN gioca_in g ON p.id_partita = g.id_partita
              WHERE g.id_utente = $1
              ORDER BY p.data_creazione DESC
          `, [idUtente]);
          
          socket.emit('storico_ricevuto', res.rows);
      } catch (err) {
          console.error("Errore recupero storico:", err);
      }
  });
});

// Avviamo il server sulla porta 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server Campo Minato in ascolto sulla porta ${PORT}`);
});