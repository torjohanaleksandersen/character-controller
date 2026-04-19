import { io } from "socket.io-client";

const socket = io(); // connects to same origin; in dev, proxy sends it to server

socket.on("connect", () => {
  console.log("connected:", socket.id);
  socket.emit("ping");
});

socket.on("pong", () => {
  console.log("got pong from server");
});