# MineSweeper MMO

Questo progetto è una versione multiplayer in tempo reale di Campo Minato (Minesweeper), dove i giocatori possono creare stanze private, personalizzare la difficoltà e collaborare per ripulire la griglia dalle mine.
- **Attualmente disponibile al link:** https://minesweepermmo.netlify.app/

## Funzionalità Attuali

- **Multiplayer in Tempo Reale:** Sincronizzazione istantanea delle mosse tra i giocatori nella stessa stanza grazie a WebSockets.
- **Stanze Dinamiche:** Crea una nuova partita personalizzata o unisciti a quella di un amico tramite un codice univoco.
- **Personalizzazione della Griglia:** Scegli tra preset (Piccolo, Medio, Grande) o usa gli slider per impostare dimensioni custom (fino a 100x100) e densità di mine (fino al 50%).
- **Motore di Gioco Indipendente:** La logica (Flood-fill, calcolo mine, condizioni di vittoria) è isolata sul server per prevenire cheat.
- **Interfaccia Reattiva:** Costruita con Vue 3 e Composition API per un'esperienza utente fluida.
- **Sistema di Account:** Registrazione, login protetto e persistenza dei dati.

- **Economia e Negozio:** Guadagno di monete a fine partita per acquistare temi, sfondi e icone.

- **Inventario:** Una "camerino" virtuale per provare ed equipaggiare gli oggetti estetici sbloccati.

- **Chat di Gioco:** Sistema di messaggistica in tempo reale all'interno delle stanze.

- **Storico e Statistiche:** Salvataggio automatico delle partite nel database, con possibilita di filtrare, riaprire i tabelloni passati e vedere le proprie classifiche.

## Stack Tecnologico

- **Frontend:** Vue 3, Vue Router, Vite, Socket.io-client
- **Backend:** Node.js, Express, Socket.io
- **Linguaggio Base:** JavaScript (ES6+)
- **Database:** PostgreSQL
- **Autenticazione e Sicurezza:** JSON Web Tokens (JWT) e bcrypt.

---

## Come installare e avviare il progetto in locale

Dopo aver scaricato o clonato questa repository, seguire questi semplici passaggi per avviare il gioco sul proprio computer.

### Prerequisiti
Assicurarsi di aver installato [Node.js](https://nodejs.org/) sul proprio computer.
Avere un database PostgreSQL funzionante
Creare un file .env nella cartella backend contenente le chiavi DATABASE_URL,  JWT_SECRET e PORT prima di digitare npm start.

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

Ecco come dialogano Client e Server in tempo reale:

### Eventi in Entrata (Dal Client al Server)
| Evento | Payload | Descrizione |
| :--- | :--- | :--- |
| unisciti_partita | { idPartita, username, idUtente, azione, dimensione, difficolta } | Richiesta di creazione o unione a una stanza. |
| mossa_utente | { idPartita, x, y, azione, idUtente } | Azione sulla griglia. "azione" può essere 'scopri' o 'bandierina'. |
| invia_messaggio_chat | { idPartita, idUtente, username, testo } | Invia un nuovo messaggio nella chat della stanza. |
| richiedi_storico | idUtente (Stringa/Intero) | Richiede al server l'elenco delle partite passate dell'utente. |

### Eventi in Uscita (Dal Server al Client)
| Evento | Payload | Descrizione |
| :--- | :--- | :--- |
| aggiorna_griglia | [Array 2D] | Invia la griglia aggiornata a tutti i membri della stanza. |
| errore_accesso | Stringa (Messaggio) | Respinge il client se ci sono problemi di connessione o permessi. |
| partita_terminata | { esito, griglia, classifica, storico, bonus } | Comunica vittoria/sconfitta, svela le mine e mostra il riepilogo punti. |
| messaggio_sistema | Stringa (Messaggio) | Notifica l'ingresso o la disconnessione di un giocatore. |
| storico_chat | [Array di Messaggi] | Invia i vecchi messaggi a un utente appena entrato nella stanza. |
| nuovo_messaggio_chat | { autore, testo, ora } | Consegna un messaggio appena scritto a tutti i presenti. |
| storico_ricevuto | [Array di Partite] | Restituisce i dati delle partite salvate nel database. |

---

## Mappa delle API REST

Il gioco utilizza le seguenti rotte HTTP per la gestione dei dati persistenti. Tutte le rotte protette richiedono l'invio del token nell'header della richiesta (`Authorization: Bearer <token>`).

### Autenticazione (Non richiedono Token)
- POST /api/auth/signup
  Payload: { username, email, password }
  Descrizione: Inserisce un nuovo utente nel database, crittografa la password e restituisce token e dati base.
  
- POST /api/auth/login
  Payload: { email, password }
  Descrizione: Verifica le credenziali utente e restituisce il token di accesso univoco.

### Negozio e Inventario
- GET /api/shop/oggetti
  Descrizione: Restituisce il catalogo completo di temi, sfondi e icone acquistabili (Pubblica, non richiede token).
  
- GET /api/shop/mio
  Descrizione: Rotta protetta. Restituisce l'inventario personale con gli oggetti già posseduti dall'utente.
  
- POST /api/shop/acquista
  Payload: { id_oggetto }
  Descrizione: Rotta protetta. Esegue una transazione sul database per acquistare un oggetto, verificando che i fondi siano sufficienti e scalando il saldo.
  
### Statistiche
- GET /api/stats/me
  Descrizione: Rotta protetta. Restituisce il profilo completo dell'utente (valuta attuale, email, vittorie totali).
  
- GET /api/stats/classifica
  Descrizione: Restituisce la Top 10 Globale dei giocatori con più valuta accumulata (Pubblica, non richiede token).