const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Importiamo il motore di gioco
const gameLogic = require('./game_logic'); 

const app = express();
const server = http.createServer(app);

// Dice a Express di servire i file della cartella frontend
app.use(express.static(path.join(__dirname, '../frontend')));

const io = new Server(server, {
  cors: { origin: "*" } // Permette al frontend di connettersi senza blocchi
});

// Questa variabile terrà in memoria (RAM) lo stato di tutte le partite in corso.
const activeGames = {}; 

// Quando un nuovo client si connette al server
io.on('connection', (socket) => {
  console.log(`Nuovo giocatore connesso! ID: ${socket.id}`);

  // 1. L'utente chiede di entrare/creare una partita
  socket.on('unisciti_partita', (dati) => {
    const { idPartita, username, azione } = dati;
    
    // CASO A: L'utente vuole unirsi a una partita
    if (azione === 'unisciti') {
      if (!activeGames[idPartita]) {
        // La stanza non esiste! Lo cacciamo.
        socket.emit('errore_accesso', 'Errore: La stanza ' + idPartita + ' non esiste o è già terminata.');
        return; // Interrompiamo tutto, non lo facciamo entrare
      }
    } 
    // CASO B: L'utente vuole CREARE una nuova partita
    else if (azione === 'crea') {
      if (!activeGames[idPartita]) {
        // Estraiamo i numeri arrivati dal frontend (o usiamo 10 come sicurezza)
        const size = parseInt(dati.dimensione) || 10;
        const perc = parseInt(dati.difficolta) || 10;
        
        // Calcoliamo quante mine piazzare fisicamente (Arrotondato per difetto)
        const mineTotali = Math.floor((size * size) * (perc / 100));

        // Creiamo una nuova partita con le impostazioni desiderate
        activeGames[idPartita] = {
          grid: gameLogic.generateEmptyGrid(size, size),
          totalMines: mineTotali,
          isFirstClick: true,
          giocatori: []
        };
      }
    }

    // Se i controlli sono passati, lo facciamo entrare nella stanza
    socket.join(idPartita);
    console.log(`${username} è entrato nella partita ${idPartita}`);
    
    activeGames[idPartita].giocatori.push(username);
    io.to(idPartita).emit('messaggio_sistema', `${username} si è unito alla partita!`);
    socket.emit('aggiorna_griglia', activeGames[idPartita].grid);
  });

  // 2. Il client invia una mossa
  socket.on('mossa_utente', (dati) => {
    const { idPartita, x, y, azione } = dati;
    const partita = activeGames[idPartita];

    // Se la partita non esiste, ignoriamo la mossa
    if (!partita) return; 

    // A. È il primo click in assoluto? Generiamo le mine
    if (azione === 'scopri' && partita.isFirstClick) {
      gameLogic.placeMines(partita.grid, partita.totalMines, x, y);
      gameLogic.calculateNumbers(partita.grid);
      partita.isFirstClick = false;
    }

    // B. Applichiamo la mossa
    if (azione === 'bandierina') {
      gameLogic.toggleFlag(partita.grid, x, y);
    } else if (azione === 'scopri') {
      // Ha cliccato una mina?
      if (partita.grid[y][x].isMine) {
        // Sveliamo tutte le mine sulla griglia
        gameLogic.revealAllMines(partita.grid);
        // Avvisiamo tutti che la partita è finita male
        io.to(idPartita).emit('partita_terminata', { esito: 'sconfitta', griglia: partita.grid });
        delete activeGames[idPartita]; // Eliminiamo la partita dalla RAM
        return;
      } else {
        // Altrimenti parte il flood-fill
        gameLogic.revealCell(partita.grid, x, y);
      }
    }

    // C. Controlliamo se questa mossa lo ha fatto vincere
    if (gameLogic.checkWin(partita.grid, partita.totalMines)) {
      io.to(idPartita).emit('partita_terminata', { esito: 'vittoria', griglia: partita.grid });
      delete activeGames[idPartita]; // Puliamo la RAM
      return;
    }

    // D. Se il gioco continua, invia la griglia aggiornata a tutta la stanza
    io.to(idPartita).emit('aggiorna_griglia', partita.grid);
  });

  // Gestione della disconnessione
  socket.on('disconnect', () => {
    console.log(`Giocatore disconnesso: ${socket.id}`);
    // Qui andrà aggiunta la logica per rimuovere l'utente dalla partita
  });
});

// Avviamo il server sulla porta 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server Campo Minato in ascolto sulla porta ${PORT}`);
});