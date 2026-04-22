# MineSweeper MMO

Questo progetto è una versione multiplayer in tempo reale di Campo Minato (Minesweeper), dove i giocatori possono creare stanze private, personalizzare la difficoltà e collaborare per ripulire la griglia dalle mine.

## Funzionalità Attuali

- **Multiplayer in Tempo Reale:** Sincronizzazione istantanea delle mosse tra i giocatori nella stessa stanza grazie a WebSockets.
- **Stanze Dinamiche:** Crea una nuova partita personalizzata o unisciti a quella di un amico tramite un codice univoco.
- **Personalizzazione della Griglia:** Scegli tra preset (Piccolo, Medio, Grande) o usa gli slider per impostare dimensioni custom (fino a 100x100) e densità di mine (fino al 50%).
- **Motore di Gioco Indipendente:** La logica (Flood-fill, calcolo mine, condizioni di vittoria) è isolata sul server per prevenire cheat.
- **Interfaccia Reattiva:** Costruita con Vue 3 e Composition API per un'esperienza utente fluida.

## Stack Tecnologico

- **Frontend:** Vue 3, Vue Router, Vite, Socket.io-client
- **Backend:** Node.js, Express, Socket.io
- **Linguaggio Base:** JavaScript (ES6+)

---

## Come installare e avviare il progetto in locale

Dopo aver scaricato o clonato questa repository, seguire questi semplici passaggi per avviare il gioco sul proprio computer.

### Prerequisiti
Assicurarsi di aver installato [Node.js](https://nodejs.org/) sul proprio computer.

### 1. Avviare il Server (Backend)
Il server gestisce la logica di gioco e la comunicazione in tempo reale.

1. Apri un terminale e naviga nella cartella del backend:
   ```bash
   cd backend

   2. Installa le dipendenze necessarie (Socket.io ed Express):
   ```bash
   npm install
   ```

3. Avvia il server:
   ```bash
   node server.js
   ```
   *Dovresti vedere il messaggio: "Server Campo Minato in ascolto sulla porta 3000". Lascia questo terminale aperto.*

### 2. Avviare l'Interfaccia (Frontend)
Ora dobbiamo avviare il sito web vero e proprio.

1. Apri un **nuovo terminale** (lasciando in esecuzione quello del server) e naviga nella cartella del frontend:
   ```bash
   cd frontend
   ```

2. Installare le dipendenze di Vue:
   ```bash
   npm install
   ```

3. Avviare l'ambiente di sviluppo:
   ```bash
   npm run dev
   ```

4. Aprire il tuo browser all'indirizzo indicato nel terminale (solitamente `http://localhost:5173`).

**Ora è possibile giocare. Aprire il sito su due finestre diverse del browser per testare il multiplayer in solitaria!**

---

## Mappa degli Eventi WebSocket (API Reference)

Ecco come dialogano Client e Server:

### Eventi in Entrata (Dal Client al Server)
| Evento | Payload | Descrizione |
| :--- | :--- | :--- |
| `unisciti_partita` | `{ idPartita, username, azione, dimensione, difficolta }` | Richiesta di creazione o unione a una stanza. |
| `mossa_utente` | `{ idPartita, x, y, azione }` | Azione sulla griglia. `azione` può essere 'scopri' o 'bandierina'. |

### Eventi in Uscita (Dal Server al Client)
| Evento | Payload | Descrizione |
| :--- | :--- | :--- |
| `aggiorna_griglia` | `[Array 2D]` | Invia la griglia aggiornata a tutti i membri della stanza. |
| `errore_accesso` | `Stringa (Messaggio)` | Respinge il client se la stanza non esiste. |
| `partita_terminata`| `{ esito, griglia }` | Comunica la vittoria o la sconfitta svelando tutte le mine. |