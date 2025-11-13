// backend/routes.js

const express = require('express');
const router = express.Router();

const UsuarioController = require('../controllers/UsuarioController.js');
const EstanteActions = require('../controllers/EstantesActions.js'); 
const LivroEstantes = require('../controllers/LivrosEstantes.js'); 
const StatusLivros = require('../controllers/StatusLivros.js'); 


const authMiddleware = require('../middlewares/authMiddleware');


/*
|--------------------------------------------------------------------------
| Rotas para gerenciar USUÁRIOS (RF01)
|--------------------------------------------------------------------------
*/
router.post('/login', UsuarioController.loginUsuario);
router.post('/usuarios', UsuarioController.cadastrarUsuario);
router.patch('/usuarios/:id', authMiddleware.authenticateToken, UsuarioController.atualizarUsuario);
router.delete('/usuarios/:id', authMiddleware.authenticateToken, UsuarioController.deletarUsuario);


/*
|--------------------------------------------------------------------------
| Rotas para gerenciar ESTANTES (RF02)
|--------------------------------------------------------------------------
*/
router.post('/estantes', authMiddleware.authenticateToken, EstanteActions.criaEstante);
router.get('/estantes', authMiddleware.authenticateToken, EstanteActions.buscaEstante);
router.patch('/estantes/:id', authMiddleware.authenticateToken, EstanteActions.atualizaNomeEstante);
router.delete('/estantes/:id', authMiddleware.authenticateToken, EstanteActions.deletaEstante);


/*
|--------------------------------------------------------------------------
| Rotas para gerenciar LIVROS_ESTANTE (RF03)
|--------------------------------------------------------------------------
*/
router.post('/estantes/:id/livros', authMiddleware.authenticateToken, LivroEstantes.adicionaLivroEstante);
router.get('/estantes/:id/livros', authMiddleware.authenticateToken, LivroEstantes.listaLivrosEstante);
router.delete('/estantes/:shelfId/livros/:bookId', authMiddleware.authenticateToken, LivroEstantes.removeLivroEstante);


/*
|--------------------------------------------------------------------------
| Rotas para gerenciar STATUS de Livros
|--------------------------------------------------------------------------
*/
router.get('/livros/status/:status', authMiddleware.authenticateToken, StatusLivros.buscaStatusLivro);
router.patch('/livros_estante/:id_associacao/status', authMiddleware.authenticateToken, StatusLivros.atualizaStatusLivro);


module.exports = router;