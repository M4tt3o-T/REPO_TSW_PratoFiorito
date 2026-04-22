import { io } from "socket.io-client";

// Da cambiare con l'indirizzo vero quando sarà online
const URL = "http://localhost:3000"; 

export const socket = io(URL, {
  autoConnect: false // Lo connettiamo manualmente dopo il login
});