exports.up = function(knex) {
  return knex.schema.createTable('usuarios', (table) => {
    table.increments('id').primary();

    table.string('username').notNullable().unique();
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable(); 

    table.string('email_validation_code').nullable();
    table.boolean('email_validated').defaultTo(false);

    table.string('nome');
    table.string('foto_perfil_url');
    table.text('biografia');
    table.json('preferencias_literarias'); 

    table.timestamps(true, true); 
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('usuarios');
};