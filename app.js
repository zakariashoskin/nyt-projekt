const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);


app.use('/socket.io', express.static(path.join(__dirname, 'node_modules', 'socket.io', 'client-dist')));


const { initializeDatabase } = require('./database');
const menuRouter = require('./menu');
const inventoryRouter = require('./inventory');

app.use(express.json());
app.use(express.static('public'));

initializeDatabase();

app.get('/', (req, res) => {
    res.send('Velkommen til appen');
});

app.use('/menu', menuRouter);
app.use('/inventory', inventoryRouter);


// Socket.io connection
io.on('connection', (socket) => {
  console.log('En bruger er forbundet');
  
  socket.on('sell_item', (menuItemId) => {
      inventoryRouter.handleItemSale(io, menuItemId);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server med Socket.IO kører på http://localhost:${PORT}`);
});

module.exports = app; // Eksporter både app og io
