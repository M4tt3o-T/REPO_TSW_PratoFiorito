import { io } from "socket.io-client";

// URL effettivo
const URL = "https://minesweeper-mmo-api.onrender.com/"; 

export const socket = io(URL, {
  autoConnect: false // Lo connettiamo manualmente dopo il login
});