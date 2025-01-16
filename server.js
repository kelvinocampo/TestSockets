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
    date: { type: Date, default: Date.now },
});
const Message = mongoose.model('Message', mensajeSchema);

// Middleware para parsear el cuerpo de las solicitudes
app.use(express.json())
    .use(express.static('public'));

app.get("/messages", async (_, res) => {
    const mensajes = await Message.find().sort({ date: 1 });
    return res.status(200).json(mensajes)
})

// Escuchar eventos de conexión
io.on('connection', async (socket) => {
    console.log('Un usuario se ha conectado');

    // Escuchar un mensaje del cliente
    socket.on('send message', async (data) => {
        const { username, message } = data;

        try {
            const nuevoMensaje = new Message({ username, message });
            await nuevoMensaje.save();

            // Emitir el mensaje a todos los usuarios conectados
            io.emit('receive message', nuevoMensaje);
        } catch (err) {
            console.log("Error al guardar el mensaje", err);
        }
    });

    // Escuchar solicitud para eliminar un mensaje
    socket.on('delete message', async (id) => {
        try {
            await Message.findByIdAndDelete(id);

            // Emitir evento para eliminar el mensaje en todos los clientes
            io.emit('delete message', id);
        } catch (err) {
            console.log("Error al eliminar el mensaje", err);
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
