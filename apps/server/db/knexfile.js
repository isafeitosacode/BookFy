const path = require('path'); 
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  // Configuração para rodar no PC
  development: {
    client: 'pg', 
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: path.resolve(__dirname, '../migrations') 
    }
  },

  // Configuração que o RENDER usará
  production: {
    client: 'pg', 
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } 
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: path.resolve(__dirname, '../migrations')
    }
  }
};