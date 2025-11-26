// /backend/server.js

const dotenv = require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/knex.js');

const routes = require('./routes/routes.js');
      
const app = express();
app.use((req, res, next) => {
  console.log(`📢 RECEBI: ${req.method} ${req.url}`);
  next();
});
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;


app.use('/api', routes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor backend rodando em http://0.0.0.0:${PORT}`);
});