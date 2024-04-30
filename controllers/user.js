const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

exports.signup = (req, res, next) => {
    // On initialise une constante qui correspond à une adresse e-mail (regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // On retourne un message d'erreur dans le cas où l'adresse mail n'est pas valide
    if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({ message: 'L\'adresse e-mail n\'est pas valide !' });
    }

    // On effectue une vérification qu'un mot de passe est bien indiqué avec 8 caractères minimum
    if (!req.body.password || req.body.password.length < 8) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères !' });
    }

    // On appelle la fonction pour hacher le MDP (ici on fait 10 tours de cryptage)
    bcrypt.hash(req.body.password, 10)
        // Promesse qui créer un utilisateur si réussie
        .then(hash => {
            // Constante avec le modèle User
            const user = new User({
                email: req.body.email,
                password: hash
            });
            // On enregistre en base de donnée
            user.save()
                .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
    // On recherche en base de donnée s'il y a bien un utilisateur avec l'email renseigné
    User.findOne({ email: req.body.email })
        .then( user => {
            // Dans le cas où il n'y en a pas, envoie un message d'erreur
            if (!user) {
                res.status(401).json({ message: 'Utilisateur non trouvé !' });
            } else {
                // Ici on compare le MDP entré avec celui de la base de donnée qui est hashé
                bcrypt.compare(req.body.password, user.password)
                    .then(valid => {
                        // Dans le cas où ça ne correspond pas, envoie un message d'erreur
                        if (!valid) {
                            res.status(401).json({ message: 'Mot de passe incorrect !' });
                        } else {
                            // Si toutes les informations sont valides, on envoie une réponse qui contient l'userId et un token de connexion crypté
                            res.status(200).json({
                                userId: user._id,
                                token: jwt.sign(
                                    { userId: user._id },
                                    'RANDOM_TOKEN_SECRET',
                                    { expiresIn: '24h' }
                                )
                            });
                        };
                    })
                    .catch(error => {
                        res.status(500).json({ error });
                    });
            };
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};