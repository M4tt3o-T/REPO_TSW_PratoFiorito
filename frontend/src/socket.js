import { io } from "socket.io-client";

// URL effettivo (da cambiare con http://localhost:3000 per test locali)
//const URL = "https://minesweeper-mmo-api.onrender.com/";
const URL = import.meta.env.VITE_SOCKET_URL;

export const socket = io(URL, {
  autoConnect: false // Lo connettiamo manualmente dopo il login
});