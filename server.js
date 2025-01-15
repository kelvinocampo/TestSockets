require('dotenv').config();

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT ?? 10000;

// Conectar a MongoDB Atlas usando Mongoose
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
    .then(() => console.log("Conectado a MongoDB Atlas"))
    .catch(err => console.log("Error de conexión a MongoDB", err));

// Definir un esquema de mensaje para MongoDB
const mensajeSchema = new mongoose.Schema({
    username: String,
    message: String,
});
const Message = mongoose.model('Message', mensajeSchema);

// Middleware para parsear el cuerpo de las solicitudes
app.use(express.json())
    .use(express.static('public'));

// Configurar Socket.IO para escuchar conexiones y mensajes
io.on('connection', async (socket) => {
    console.log('Un usuario se ha conectado');

    const mensajes = await Message.find();
    io.emit("init chat", mensajes);

    // Escuchar un mensaje del cliente
    socket.on('send message', async (data) => {
        const { username, message } = data;

        // Guardar el mensaje en MongoDB
        try {
            const nuevoMensaje = new Message({ username, message });
            await nuevoMensaje.save();

            // Emitir el mensaje a todos los usuarios conectados
            io.emit('receive message', nuevoMensaje);
        } catch (err) {
            console.log("Error al guardar el mensaje", err);
        }
    });

    // Escuchar cuando un usuario se desconecte
    socket.on('disconnect', () => {
        console.log('Un usuario se ha desconectado');
    });
});

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
