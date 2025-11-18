const db = require('../db/knex.js');

const buscaStatusLivro = async (req, res) => {
    try {
        const { status } = req.params;
        const decodedStatus = decodeURIComponent(status);
        const userId = req.user.id;  

        const livros = await db('Livros_Estante')
            .join('Livros', 'Livros_Estante.id_livro_fk', '=', 'Livros.google_book_id')
            .where('Livros_Estante.status', decodedStatus)
            .andWhere('Livros_Estante.id_usuario', userId)  
            .select(
                'Livros.*',
                'Livros_Estante.status',
                'Livros_Estante.id_associacao'
            );
        res.json(livros);
    } catch (error) {
        console.error(`Erro ao listar livros com status ${req.params.status}:`, error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
};

const atualizaStatusLivro =  async (req, res) => {
    try {
        const { id_associacao } = req.params;
        const { status } = req.body;
        const userId = req.user.id;  
        
        if (!status) {
            return res.status(400).json({ message: "O novo status é obrigatório." });
        }

        const [updatedEntry] = await db('Livros_Estante')
            .where({ id_associacao: id_associacao, id_usuario: userId }) 
            .update({ status: status })
            .returning('*'); 

        if (updatedEntry) {
            res.status(200).json(updatedEntry);
        } else {
            res.status(404).json({ message: "Associação livro-estante não encontrada ou você não tem permissão." });
        }
    } catch (error) {
        console.error("Erro ao atualizar status do livro:", error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
};

module.exports = {
    buscaStatusLivro,
    atualizaStatusLivro
};