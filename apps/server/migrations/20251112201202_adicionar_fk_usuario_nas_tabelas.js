exports.up = function(knex) {
  return knex.schema.alterTable('Estantes', (table) => {
    // 1. Adiciona a coluna id_usuario na tabela 'Estantes'
    table.integer('id_usuario')
         .unsigned() 
         .notNullable() 
         .references('id') 
         .inTable('usuarios') 
         .onDelete('CASCADE');
  })
  .then(() => {
    // 2. Adiciona a coluna id_usuario na tabela 'Livros_Estante'
    return knex.schema.alterTable('Livros_Estante', (table) => {
      table.integer('id_usuario')
           .unsigned()
           .notNullable()
           .references('id')
           .inTable('usuarios')
           .onDelete('CASCADE'); 
    });
  });
};

exports.down = function(knex) {

  return knex.schema.alterTable('Estantes', (table) => {
    table.dropColumn('id_usuario');
  })
  .then(() => {
    return knex.schema.alterTable('Livros_Estante', (table) => {
      table.dropColumn('id_usuario');
    });
  });
};