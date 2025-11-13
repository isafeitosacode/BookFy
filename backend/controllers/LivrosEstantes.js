const db = require('../db/knex.js');

const listaLivrosEstante = async (req, res) => {
    try {
        const { id } = req.params; // Este é o id_estante_fk
        const userId = req.user.id; // <-- MUDANÇA: Pega o ID do usuário logado

        // --- MUDANÇA: VERIFICAÇÃO DE SEGURANÇA ---
        // Primeiro, verifique se a estante pertence ao usuário
        const estante = await db('Estantes').where({ id_estante: id, id_usuario: userId }).first();
        if (!estante) {
            return res.status(404).json({ message: "Estante não encontrada ou você não tem permissão." });
        }
        // --- FIM DA VERIFICAÇÃO ---

        // Agora sim, execute sua query original, pois sabemos que o usuário é o dono
        const livros = await db('Livros_Estante')
            .join('Livros', 'Livros_Estante.id_livro_fk', '=', 'Livros.google_book_id')
            .where({ id_estante_fk: id }) // Só precisamos filtrar pela estante, pois já validamos o dono
            .select(
                'Livros.*', 
                'Livros_Estante.status', 
                'Livros_Estante.id_associacao'
            );
        
        res.json(livros);
    } catch (error) {
        console.error("Erro ao listar livros da estante:", error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
};

const adicionaLivroEstante = async (req, res) => {
    
    const { id: id_estante_fk } = req.params;
    const { google_book_id, titulo, autores, capa_url, descricao, status } = req.body;
    const userId = req.user.id; 

    if (!google_book_id) {
        return res.status(400).json({ message: "O ID do livro é obrigatório." });
    }

    try {
        const estante = await db('Estantes').where({ id_estante: id_estante_fk, id_usuario: userId }).first();
        if (!estante) {
            return res.status(404).json({ message: "Estante não encontrada ou você não tem permissão." });
        }

        await db.transaction(async trx => {

            await trx('Livros')
                .insert({
                    google_book_id,
                    titulo,
                    autores: JSON.stringify(autores || []), 
                    capa_url,
                    descricao
                })
                .onConflict('google_book_id') 
                .ignore();                  


            await trx('Livros_Estante').insert({ 
                id_livro_fk: google_book_id, 
                id_estante_fk, 
                status: status || 'Quero Ler',
                id_usuario: userId 
            });
        });

        res.status(201).json({ message: "Livro adicionado à estante com sucesso." });
    } catch (error) {
        if (error.code === '23505') { 
            return res.status(409).json({ message: "Este livro já está nesta estante." });
        }
        console.error("Erro ao adicionar livro à estante:", error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
};

const removeLivroEstante =  async (req, res) => {
    try {
        const { shelfId, bookId } = req.params; 
        const userId = req.user.id;


        const estante = await db('Estantes').where({ id_estante: shelfId, id_usuario: userId }).first();
        if (!estante) {
            return res.status(404).json({ message: "Estante não encontrada ou você não tem permissão." });
        }

        const count = await db('Livros_Estante')
            .where({ id_estante_fk: shelfId, id_livro_fk: bookId })

            .andWhere({ id_usuario: userId }) 
            .del();
        
        if (count > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: "Este livro não foi encontrado nesta estante." });
        }
    } catch (error) {
        console.error("Erro ao remover livro da estante:", error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
};

module.exports = {
    listaLivrosEstante,
    adicionaLivroEstante,
    removeLivroEstante
};