const { createServer } = require("http");
const next = require("next");
const dotenv = require("dotenv");
dotenv.config();
const { Server } = require("socket.io");
const {generateResponce} = require("./lib/responseGenerator.ts")
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handler(req, res));

  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("user_message", async(data) => {

      const answer = await generateResponce(data.text, data.pdfId);
      socket.emit("agent_message", {
        text: answer,
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  server.listen(3000, () => {
    console.log("🚀 Server ready on http://localhost:3000");
  });
});
