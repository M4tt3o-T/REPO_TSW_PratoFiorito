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

// Mette o toglie una bandierina su una cella coperta
function toggleFlag(grid, x, y) {
  let cell = grid[y][x];
  
  // Non si può mettere una bandierina su una cella già scoperta
  if (!cell.isRevealed) {
    // Inverte lo stato: se era false diventa true, se era true diventa false
    cell.isFlagged = !cell.isFlagged; 
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


module.exports = {
  generateEmptyGrid,
  placeMines,
  calculateNumbers,
  revealCell,
  toggleFlag,
  checkWin
};