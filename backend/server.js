// /backend/server.js

const dotenv = require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/knex.js');

// 1. Importe o novo arquivo de rotas
const routes = require('./routes/routes.js');
      
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 2. Use as rotas com o prefixo '/api'
// Todas as rotas em 'routes.js' serão automaticamente
// prefixadas com /api
app.use('/api', routes);

// Listener do servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor backend rodando em http://0.0.0.0:${PORT}`);
});