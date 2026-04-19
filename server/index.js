import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  // In production we serve from same origin, so no CORS needed.
  // For dev, Vite will proxy, so still same origin in practice.
});

const PORT = process.env.PORT || 3000;

// Needed because we are using ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve the built client (production)
app.use(express.static(path.join(__dirname, "dist")));

// Example API route
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("user connected:", socket.id);

  socket.on("ping", () => {
    socket.emit("pong");
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });
});

// SPA fallback (must be AFTER API routes)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
