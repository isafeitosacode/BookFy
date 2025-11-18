const db = require('../db/knex.js');
const dotenv = require('dotenv').config();

// Esse método busca todas estantes existentes no Banco de Dados referente ao usuário loggado.
const buscaEstante = async (req, res) => {
  try {
    const userId = req.user.id; // <-- Pega o ID do usuário logado (do middleware)
    const estantes = await db('Estantes')
      .select('*')
      .where({ id_usuario: userId }) 
      .orderBy('nome', 'asc');
      
    res.json(estantes);
  } catch (error) {
    console.error("Erro ao listar estantes:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// Esse método cria estantes no Banco de Dados relacionando-a ao usuário loggado.
const criaEstante = async (req, res) => {
    try {
        const { nome } = req.body; 
        const userId = req.user.id; // <-- Pega o ID do usuário logado

        if (!nome || nome.trim() === '') {
            return res.status(400).json({ message: "O nome da estante é obrigatório." });
        }
        

        const [estanteAdicionada] = await db('Estantes')
            .insert({ 
                nome: nome.trim(),
                id_usuario: userId 
             })
            .returning('*');

        res.status(201).json(estanteAdicionada);

    } catch (error) {
        if (error.code === '23505') { 
            // NOTA: Esse erro agora pode disparar se o (id_usuario, nome) for duplicado.
            // O ideal é a restrição no DB ser (id_usuario, nome).
            return res.status(409).json({ message: "Uma estante com este nome já existe." });
        }
        console.error("Erro ao criar estante:", error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
};

// Esse método atualiza o nome da estante selecionada. Obs: Só é possível alterar o nome se for o dono daquela estante.
const atualizaNomeEstante = async (req, res) => { 
    try {
        const { id } = req.params;
        const { nome } = req.body;
        const userId = req.user.id; 

        if (!nome || nome.trim() === '') {
            return res.status(400).json({ message: "O nome da estante é obrigatório." });
        }

        const count = await db('Estantes')
          .where({ id_estante: id, id_usuario: userId })
          .update({ nome: nome.trim() });

        if (count > 0) {
            res.status(200).json({ message: "Estante atualizada com sucesso." });
        } else {
            res.status(404).json({ message: "Estante não encontrada ou você não tem permissão." });
        }
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: "Uma estante com este nome já existe." });
        }
        console.error("Erro ao atualizar estante:", error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
};

// Esse deleta a estante selecionada do Banco de Dados. 
const deletaEstante = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id; 

        // 1. Verifique se a estante pertence ao usuário antes de deletar os livros
        const estante = await db('Estantes').where({ id_estante: id, id_usuario: userId }).first();
        if (!estante) {
            return res.status(404).json({ message: "Estante não encontrada ou você não tem permissão." });
        }

        await db('Livros_Estante') 
            .where({ id_estante: id, id_usuario: userId }) 
            .del();

        // 3. Delete a estante
        const count = await db('Estantes')
            .where({ id_estante: id, id_usuario: userId }) 
            .del();
        
        if (count > 0) {
            res.status(204).send(); 
        } else {
            // Isso não deve acontecer por causa da checagem no início
            res.status(404).json({ message: "Estante não encontrada." });
        }
    } catch (error) {
        console.error("Erro ao deletar estante:", error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
};

const buscaAleatoria = async (req, res) => {
    
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    if (!apiKey) {
        console.error("ERRO: GOOGLE_BOOKS_API_KEY não foi definida no arquivo .env");
        return res.status(500).json({ message: "Erro de configuração no servidor." });
    }

    let listaDeInteresses;

    // --- CORREÇÃO AQUI ---
    // Leia de 'req.user' (sem "o"), que é o que o seu middleware salva.
    const usuarioId = req.user.id; 
    // --- FIM DA CORREÇÃO ---

    try { 
        const usuario = await db('usuarios').where({ id: usuarioId }).first();

        if (usuario && usuario.preferencias_literarias && usuario.preferencias_literarias.length >= 2) {
            listaDeInteresses = usuario.preferencias_literarias;
            if (typeof listaDeInteresses === 'string') {
                 listaDeInteresses = JSON.parse(listaDeInteresses);
            }
        } else {
            listaDeInteresses = [
                'subject:software+development',
                'subject:science+fiction',
                'subject:history'
            ];
        }
    } catch (dbError) {
        console.error("Erro ao buscar usuário no banco:", dbError);
        return res.status(500).json({ message: "Erro interno ao buscar preferências." });
    }

    const categoriaDaVez = listaDeInteresses[Math.floor(Math.random() * listaDeInteresses.length)];

    const GOOGLE_API_URL = 'https://www.googleapis.com/books/v1/volumes';
    const maxResults = 18;
    
    // Garantindo que a correção da apiKey também está aqui
    const url = `${GOOGLE_API_URL}?q=${categoriaDaVez}&maxResults=${maxResults}&key=${apiKey}`;

    try {
        const apiResponse = await fetch(url);
        
        if (!apiResponse.ok) {
            throw new Error(`Google Books API respondeu com status ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        res.status(200).json(data.items || []);

    } catch (error) {
        console.error("Erro ao buscar livros na Google API:", error);
        res.status(500).json({ message: "Erro ao se comunicar com o serviço externo de livros." });
    }
};


module.exports = {
  buscaEstante,
  criaEstante,
  atualizaNomeEstante,
  deletaEstante,
  buscaAleatoria 
};


       