// backend/middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');

exports.authenticateToken = (req, res, next) => {
  // 1. Pegar o token do cabeçalho de Autorização
  const authHeader = req.headers['authorization'];
  // Formato esperado: "Bearer TOKEN"
  const token = authHeader && authHeader.split(' ')[1]; 

  if (token == null) {
    // Se não há token, acesso não autorizado
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  // 2. Verificar e decodificar o token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Se o token é inválido (expirado, modificado, etc.)
      return res.status(403).json({ error: 'Token de autenticação inválido ou expirado.' });
    }
    
    // 3. Se o token é válido, anexar os dados do usuário à requisição
    // Agora, qualquer rota que usar este middleware terá req.user disponível
    req.user = user; // { id: usuario.id, username: usuario.username }
    next(); // Passa para a próxima função (o controller da rota)
  });
};