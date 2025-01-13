const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Configurar el servidor HTTP y Socket.IO
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir los archivos estáticos del cliente
app.use(express.static('public'));

// Manejar conexiones de clientes
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    // Escuchar eventos de mensaje
    socket.on('chat_message', (data) => {
        console.log(`Mensaje recibido: ${data.name}: ${data.message}`);

        // Emitir el mensaje a todos los clientes conectados
        io.emit('chat_message', data);
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
