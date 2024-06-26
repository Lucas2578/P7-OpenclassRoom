const Book = require('../models/Book');
const fs = require('fs');

exports.createBook = (req, res, next) => {
    // On initialise une constante qui comporte le corps de la requête du formulaire book
    // On utilise JSON.parse() pour transformer les données JSON en objet JavaScript
    const bookObject = JSON.parse(req.body.book);

    if (!bookObject.title || !bookObject.author || !bookObject.year || !bookObject.genre) {
        if (req.file) {
            // Si un champ est manquant, on supprime le fichier téléchargé s'il existe
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.log(err);
                }
                return res.status(400).json({ message: 'Tous les champs sont obligatoires !' });
            });
        } else {
            return res.status(400).json({ message: 'Tous les champs sont obligatoires !' });
        }
    }

    // On supprime le champ _id car MongoDB génère automatiquement un nouvel id unique pour chaque nouveau document
    delete bookObject._id;

    // On enlève "_userId" pour éviter que quelqu'un change manuellement qui est le propriétaire du livre
    // On utilise les infos d'authentification pour savoir qui est l'utilisateur actuel
    delete bookObject._userId;

    // On créer un nouvel objet de livre en utilisant bookObject
    const book = new Book({
        // Données ajoutées par l'utilisateur
        ...bookObject,
        // userId authentifié de l'utilisateur qui ajoute le livre
        userId: req.auth.userId,
        // URL vers le fichier image du livre
        imageUrl: `${req.protocol}://${req.get('host')}/images/resized_${req.file.filename}`,
        // Note moyenne du livre
        averageRating: bookObject.ratings[0].grade,
    });

    book.save()
        .then(() => { 
            res.status(201).json({ message: 'Objet enregistré !' });
        })
        .catch(error => { 
            res.status(400).json({ error });
        });
}

exports.getOneBook = (req, res, next) => {
    // On recherche le livre de la page en cours de lecture
    Book.findOne({ _id: req.params.id })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(404).json({ error }));
}

exports.getAllBook = (req, res, next) => {
    // On recherche toutes les données liées à la table "Book"
    Book.find()
        // On les renvoie sous forme de liste d'objets JSON
        .then(books => res.status(200).json(books))
        .catch(error => res.status(404).json({ error }));
}

exports.deleteBook = (req, res, next) => {
    // On recherche le livre que l'on souhaite supprimer
    Book.findOne({ _id: req.params.id })
        .then(book => {
            // On extrait le nom du fichier de l'image du livre
            const fileName = book.imageUrl.split('/images/')[1];
            // On supprime le fichier image du système de fichiers
            fs.unlink(`images/${fileName}`, () => {
                // On supprime également de la base de donnée
                Book.deleteOne({ _id: req.params.id })
                    .then(() => { res.status(200).json({ message: 'Objet supprimé !' }) })
                    .catch(error => res.status(400).json({ error }));
            })
        })
        .catch( error => {
            res.status(404).json({ error });
        })
}

exports.updateBook = (req, res, next) => {
    // On récupère l'id du livre en cours d'édition
    const bookId = req.params.id;

    // On stock toutes les données du livre modifié
    const bookData = req.body;

    // On vérifie ici si une nouvelle image a été upload, on insère la nouvelle image dans la variable imageUrl, sinon la variable reste indéfinie
    let imageUrl;
    if (req.file) {
        imageUrl = `${req.protocol}://${req.get('host')}/images/resized_${req.file.filename}`;
    }

    // On met à jour les champs du livre avec la requête du formulaire
    let updateParams;
    if (req.body.book) {
        try {
            updateParams = {
                ...JSON.parse(req.body.book),
                // Si imageUrl n'est pas définie, on ajoute alors l'url de l'image qui n'a pas été changée dans cette variable
                imageUrl: imageUrl || bookData.imageUrl
            };
        } catch (error) {
            return res.status(400).json({ message: "Données du livre invalides." });
        }
    } else {
        updateParams = {
            ...bookData,
            // Si imageUrl n'est pas définie, on ajoute alors l'url de l'image qui n'a pas été changée dans cette variable
            imageUrl: imageUrl || bookData.imageUrl
        };
    }

    // On vérifie si tous les champs requis sont présents
    if (!updateParams.title || !updateParams.author || !updateParams.genre || !updateParams.year) {
        // Si un champ est manquant et qu'un fichier a été téléchargé, on supprime le fichier
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        }
        return res.status(400).json({ message: 'Tous les champs sont obligatoires !' });
    }

    // On cherche le livre en cours d'édition
    Book.findOne({ _id: bookId })
        .then(book => {
            if (!book) {
                return res.status(404).json({ message: 'Livre non trouvé' });
            }
            if (book.userId !== req.auth.userId) {
                return res.status(403).json({ message: '403: unauthorized request ' });
            }
            // On met à jour le livre avec les nouvelles données envoyées à l'aide du formulaire par l'utilisateur
            Book.updateOne({ _id: bookId }, { ...updateParams, _id: req.params.id })
                .then(() => {
                    res.status(200).json({ message: 'Livre modifié avec succès' });
                })
                .catch(error => {
                    console.error(error);
                    res.status(500).json({ error });
                });
        })
        .catch(error => {
            console.error(error);
            res.status(500).json({ error });
        });
};

exports.rateBook = (req, res, next) => {
    // On initialise deux constantes pour récupérer l'id du livre et de l'utilisateur
    const userId = req.auth.userId;
    const bookId = req.params.id;

    Book.findOne({ _id: bookId })
        .then( book => {
            // On initialise une constante qui renvoie soit "false" soit "true" pour savoir si le livre a déjà été noté
            const isAlreadyRated = book.ratings.some((book) => book.userId === userId);
              if ( !isAlreadyRated) {
                // Si ça renvoie "false", on ajoute la note avec l'userId qui vient de noter
                book.ratings.push({ userId: req.auth.userId, grade: req.body.rating })
                // Méthode de calcul de moyenne de note
                const ratings = book.ratings.map(rating => rating.grade);
                const newAverageRating = ratings.reduce((total, current) => total + current, 0) / ratings.length;
                // On remplace l'ancienne moyenne par la nouvelle
                book.averageRating = newAverageRating;
    
                // On sauvegarde dans la db
                return book.save()
                } else {
                    res.status(401).json({ message: 'Vous avez déjà noté ce livre !' });
                }
            })
        // Met à jour la réponse HTTP pour le client
        .then(book => res.status(201).json(book))
        .catch(error => res.status(500).json({ error }));
};

exports.getBestRating = (req, res, next) => {
    // On récupère tous les livres et on fait un trie descendant (plus grand au plus petit), limité à 3 livres
    Book.find().sort({ averageRating: -1 }).limit(3)
        .then(topBooks => res.status(200).json(topBooks))
        .catch(error => res.status(404).json({ error }));
};