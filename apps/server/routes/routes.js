// backend/routes.js

const express = require('express');
const router = express.Router();

const UsuarioController = require('../controllers/UsuarioController.js');
const EstantesController = require('../controllers/EstantesController.js'); 
const LivroEstantesController = require('../controllers/LivrosEstantesController.js'); 
const StatusLivrosController = require('../controllers/StatusLivrosController.js'); 


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
router.post('/estantes', authMiddleware.authenticateToken, EstantesController.criaEstante);
router.get('/estantes', authMiddleware.authenticateToken, EstantesController.buscaEstante);
router.patch('/estantes/:id', authMiddleware.authenticateToken, EstantesController.atualizaNomeEstante);
router.delete('/estantes/:id', authMiddleware.authenticateToken, EstantesController.deletaEstante);
router.get('/livros/aleatorios', authMiddleware.authenticateToken, EstantesController.buscaAleatoria);

/*
|--------------------------------------------------------------------------
| Rotas para gerenciar LIVROS_ESTANTE (RF03)
|--------------------------------------------------------------------------
*/
router.post('/estantes/:id/livros', authMiddleware.authenticateToken, LivroEstantesController.adicionaLivroEstante);
router.get('/estantes/:id/livros', authMiddleware.authenticateToken, LivroEstantesController.listaLivrosEstante);
router.delete('/estantes/:shelfId/livros/:bookId', authMiddleware.authenticateToken, LivroEstantesController.removeLivroEstante);


/*
|--------------------------------------------------------------------------
| Rotas para gerenciar STATUS de Livros
|--------------------------------------------------------------------------
*/
router.get('/livros/status/:status', authMiddleware.authenticateToken, StatusLivrosController.buscaStatusLivro);
router.patch('/livros_estante/:id_associacao/status', authMiddleware.authenticateToken, StatusLivrosController.atualizaStatusLivro);


module.exports = router;