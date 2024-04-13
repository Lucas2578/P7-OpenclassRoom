const jwt = require('jsonwebtoken');

// Middleware pour l'authentification des utilisateurs
module.exports = (req, res, next) => {
    try {
        // On met dans un tableau séparément "Bearer" (type de token) et le token de connexion
        const token = req.headers.authorization.split(' ')[1];
        // On vérifie ici que le token est valide et non altéré
        const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
        const userId = decodedToken.userId;
        // On ajoute à la requête (req) une info qui dit qui est connecté, en l'occurrence, son identifiant (userId)
        req.auth = {
            userId: userId
        }
        next();
    } catch(error) {
        res.status(401).json({ error });
    }
}