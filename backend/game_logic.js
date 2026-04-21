// ==========================================
// 1. MOTORE DEL GIOCO (Funzioni)
// ==========================================

// Crea la griglia vuota iniziale
function generateEmptyGrid(width, height) {
  let grid = [];
  for (let y = 0; y < height; y++) {
    let row = [];
    for (let x = 0; x < width; x++) {
      row.push({
        x: x,
        y: y,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0
      });
    }
    grid.push(row);
  }
  return grid; // Restituisce la griglia pronta
}

// Piazza le mine in modo casuale, evitando il primo click
function placeMines(grid, totalMines, firstClickX, firstClickY) {
  const height = grid.length;
  const width = grid[0].length;
  let placedMines = 0;

  while (placedMines < totalMines) {
    let randY = Math.floor(Math.random() * height);
    let randX = Math.floor(Math.random() * width);

    if (grid[randY][randX].isMine) continue;

    if (Math.abs(randX - firstClickX) <= 1 && Math.abs(randY - firstClickY) <= 1) {
        continue; 
    }

    grid[randY][randX].isMine = true;
    placedMines++;
  }
}

// Calcola i numeretti per le celle vuote
function calculateNumbers(grid) {
  const height = grid.length;
  const width = grid[0].length;
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1],          [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1]
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].isMine) continue; // Salta se è una mina
      
      let count = 0;
      for (let dir of directions) {
        let checkY = y + dir[0];
        let checkX = x + dir[1];
        
        if (checkY >= 0 && checkY < height && checkX >= 0 && checkX < width) {
          if (grid[checkY][checkX].isMine) {
            count++;
          }
        }
      }
      grid[y][x].adjacentMines = count;
    }
  }
}

// L'algoritmo di Scoperta a Cascata (Flood-Fill)
function revealCell(grid, startX, startY) {
  const height = grid.length;
  const width = grid[0].length;
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1],          [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1]
  ];

  let stack = [[startY, startX]];

  while (stack.length > 0) {
    let [currY, currX] = stack.pop();
    let cell = grid[currY][currX];

    if (cell.isRevealed || cell.isFlagged) continue;

    cell.isRevealed = true;

    // Se è uno "0", aggiungi i vicini allo stack per esplorarli
    if (cell.adjacentMines === 0 && !cell.isMine) {
      for (let dir of directions) {
        let nY = currY + dir[0];
        let nX = currX + dir[1];
        if (nY >= 0 && nY < height && nX >= 0 && nX < width) {
           stack.push([nY, nX]);
        }
      }
    }
  }
}

// Controlla se il giocatore ha vinto
function checkWin(grid, totalMines) {
  let revealedCount = 0;
  const height = grid.length;
  const width = grid[0].length;

  // Conta quante celle sono state scoperte finora
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].isRevealed) {
        revealedCount++;
      }
    }
  }

  const totalCells = width * height;
  
  // Ritorna 'true' se le celle scoperte sono tutte quelle senza mine
  return revealedCount === (totalCells - totalMines);
}

// Funzione di utilità per stampare la griglia nel terminale
function printGrid(grid) {
  console.log("\n--- STATO ATTUALE DELLA GRIGLIA ---");
  for (let y = 0; y < grid.length; y++) {
    let rowString = "";
    for (let x = 0; x < grid[y].length; x++) {
      let cell = grid[y][x];
      
      if (!cell.isRevealed) {
        rowString += "[ ]"; // Cella coperta
      } else if (cell.isMine) {
        rowString += "[*]"; // Mina
      } else if (cell.adjacentMines === 0) {
        rowString += " . "; // Vuoto
      } else {
        rowString += ` ${cell.adjacentMines} `; // Numero
      }
    }
    console.log(rowString);
  }
  console.log("-----------------------------------\n");
}


// ==========================================
// 2. AREA DI TEST INTERATTIVA (Console)
// ==========================================

const readline = require('readline'); // Importa il modulo nativo di Node.js

// Crea l'interfaccia per leggere e scrivere nel terminale
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configurazione della partita
const width = 10;
const height = 10;
const totalMines = 10;
let myGrid = generateEmptyGrid(width, height);
let isFirstClick = true;

console.log(`\n=== BENVENUTO A CAMPO MINATO (${width}x${height}) ===`);
console.log("Scopo: Scopri tutte le celle vuote senza esplodere.");
printGrid(myGrid);

// Questa è la funzione ricorsiva (il "Game Loop" asincrono)
function askForMove() {
  rl.question('Inserisci le coordinate x e y separate da spazio (es. "5 4") o "q" per uscire: ', (answer) => {
    
    // Condizione di uscita
    if (answer.toLowerCase() === 'q') {
      console.log("Partita interrotta.");
      rl.close(); // Chiude il programma
      return;
    }

    // Parsing dell'input dell'utente
    const parts = answer.split(' ');
    if (parts.length !== 2) {
      console.log("Errore: Input non valido. Usa il formato 'riga colonna' (es. 3 7).");
      return askForMove();
    }

    // NUOVA ASSEGNAZIONE INVERTITA:
    const y = parseInt(parts[0], 10); // Il primo numero è la RIGA (y)
    const x = parseInt(parts[1], 10); // Il secondo numero è la COLONNA (x)
    
    // Controlla se l'utente ha inserito lettere o numeri fuori dal bordo
    if (isNaN(x) || isNaN(y) || x < 0 || x >= width || y < 0 || y >= height) {
      console.log(`Errore: Coordinate fuori dal campo (usa numeri da 0 a ${width - 1} per le colonne e da 0 a ${height - 1} per le righe).`);
      return askForMove();
    }

    // --- ESECUZIONE DELLA LOGICA DI GIOCO ---

    // 1. Se è la prima mossa in assoluto, piazza le mine e calcola i numeri
    if (isFirstClick) {
      placeMines(myGrid, totalMines, x, y);
      calculateNumbers(myGrid);
      isFirstClick = false;
    }

    // 2. Se la cella è già scoperta, avvisa l'utente
    if (myGrid[y][x].isRevealed) {
      console.log("Cella già scoperta! Scegline un'altra.");
      return askForMove();
    }

    // 3. Controllo Sconfitta (Hai cliccato una mina!)
    if (myGrid[y][x].isMine) {
      myGrid[y][x].isRevealed = true; // Mostra la mina che ti ha ucciso
      printGrid(myGrid);
      console.log("\nBOOM! Hai calpestato una mina alle coordinate (" + x + ", " + y + "). GAME OVER!\n");
      rl.close();
      return;
    }

    // 4. Se sei salvo, innesca la scoperta a cascata
    revealCell(myGrid, x, y);

    // 5. Controllo Vittoria!
    if (checkWin(myGrid, totalMines)) {
      printGrid(myGrid); // Stampa la griglia finale
      console.log("\nCONGRATULAZIONI! Hai ripulito il campo minato! HAI VINTO!\n");
      rl.close(); // Chiude il gioco
      return;
    }

    // Stampa la nuova griglia aggiornata (se la partita continua)
    printGrid(myGrid);

    // Rimette il server in ascolto per la mossa successiva
    askForMove();
  });
}

// Avvia il loop di gioco!
askForMove();