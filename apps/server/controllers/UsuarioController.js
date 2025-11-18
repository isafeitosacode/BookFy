const db = require('../db/knex');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 


// RF01.1 – Consultar usuário
// GET /api/usuarios/:username
exports.consultarUsuario = async (req, res) => {
  try {
    const { username } = req.params;
    const usuario = await db('usuarios').where({ username }).first();  

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
 
    delete usuario.password_hash;
    
    res.json(usuario);

  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar usuário.', details: err.message });
  }
};

// RF01.2 – Cadastrar novo usuário
// POST /api/usuarios
exports.cadastrarUsuario = async (req, res) => {
  try {
    
    const { username, email, password, preferencias} = req.body;

    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos (username, email, password) são obrigatórios.' });
    }


    const password_hash = await bcrypt.hash(password, 10);

    const [{ id: novoUsuarioId }] = await db('usuarios')
      .insert({
        username,
        email,
        password_hash,
        preferencias_literarias: JSON.stringify(preferencias)
      })
      .returning('id');

    const usuarioCriado = await db('usuarios').where({ id: novoUsuarioId }).first();

    res.status(201).json(usuarioCriado); 

  } catch (err) {

    if (err.code === '23505') { 
      return res.status(409).json({ error: 'Email ou username já cadastrado.', details: err.detail });
    }

    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar usuário.', details: err.message });
  }
};

// RF01.4 – Editar dados do usuário
// PATCH /api/usuarios/:id
exports.atualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, foto_perfil_url, biografia, preferencias_literarias } = req.body;
    

    if (parseInt(id, 10) !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para editar este usuário.' });
    }


    const dadosParaAtualizar = {};
    if (nome !== undefined) dadosParaAtualizar.nome = nome;
    if (foto_perfil_url !== undefined) dadosParaAtualizar.foto_perfil_url = foto_perfil_url;
    if (biografia !== undefined) dadosParaAtualizar.biografia = biografia;
    if (preferencias_literarias !== undefined) dadosParaAtualizar.preferencias_literarias = preferencias_literarias;

    if (Object.keys(dadosParaAtualizar).length === 0) {
      return res.status(400).json({ error: 'Nenhum dado para atualizar foi fornecido.' });
    }

    const [usuarioAtualizadoId] = await db('usuarios')
      .where({ id: id }) 
      .update({
        ...dadosParaAtualizar,
        updated_at: db.fn.now()
      })
      .returning('id');

    if (!usuarioAtualizadoId) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const usuarioAtualizado = await db('usuarios').where({ id: usuarioAtualizadoId.id ?? usuarioAtualizadoId }).first();
    delete usuarioAtualizado.password_hash; 


    res.json(usuarioAtualizado);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar usuário.', details: err.message });
  }
};

// RF01.5 – Excluir conta do usuário
// DELETE /api/usuarios/:id
exports.deletarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id, 10) !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para excluir este usuário.' });
    }

    const numLinhasDeletadas = await db('usuarios')
      .where({ id: id })
      .del();

    if (numLinhasDeletadas > 0) {
      res.status(204).send(); 
    } else {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar usuário.', details: err.message });
  }
};

// --- FUNÇÃO DE LOGIN ---
exports.loginUsuario = async (req, res) => {
  try {

    const { email, password } = req.body; 
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email/username e senha são obrigatórios.' });
    }


    const usuario = await db('usuarios')
      .where({ email: email })
      .orWhere({ username: email }) 
      .first();

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas.' }); 
    }


    const senhaCorreta = await bcrypt.compare(password, usuario.password_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }


    const token = jwt.sign(
      { id: usuario.id, username: usuario.username }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' } 
    );


    delete usuario.password_hash; 
    res.json({ usuario, token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao fazer login.', details: err.message });
  }
};
