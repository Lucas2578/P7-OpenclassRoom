const Book = require('../models/Book');
const fs = require('fs');

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/resized_${req.file.filename}`,
        averageRating: bookObject.ratings[0].grade,
    });

    book.save()
        .then(() => { res.status(201).json({ message: 'Objet enregistré !' })})
        .catch(error => { console.log(error); res.status(400).json({ error })})
}

exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(404).json({ error }));
}

exports.getAllBook = (req, res, next) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(404).json({ error }));
}

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            const fileName = book.imageUrl.split('/images/')[1];
            fs.unlink(`images/${fileName}`, () => {
                Book.deleteOne({ _id: req.params.id })
                    .then(() => { res.status(200).json({ message: 'Objet supprimé !' }) })
                    .catch(error => res.status(400).json({ error }));
            })
        })
        .catch( error => {
            res.status(404).json({ error });
        })
}

exports.modifyBook = (req, res, next) => {
    // Vérifier si un fichier a été téléchargé
    if (req.file) {
        // Mise à jour de l'URL de l'image du livre avec l'URL du fichier téléchargé
        req.body.imageUrl = `${req.protocol}://${req.get('host')}/images/resized_${req.file.filename}`;
    }

    // Récupérer les nouvelles informations du livre depuis le corps de la requête
    const updatedBook = req.body;

    // Mettre à jour le livre dans la base de données en fonction de son id
    Book.findByIdAndUpdate(req.params.id, updatedBook)
        .then(() => {
            res.status(200).json({ message: 'Livre mis à jour avec succès !' });
        })
        .catch(error => {
            res.status(400).json({ error });
        });
};

exports.rateBook = (req, res, next) => {
    // On initialise deux constantes pour récupérer l'id du livre et de l'utilisateur
    const userId = req.auth.userId;
    const bookId = req.params.id;

    Book.findOne({ _id: bookId })
        .then( book => {
            // On initialise une constante qui renvoie soit "false" soit "true" pour savoir si le livre a déjà été noté
            const isAlreadyRated = book.ratings.find((book) => book.userId === userId);
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
                    res.status(401).json({message: 'Vous avez déjà noté ce livre !'});
                }
            })
        // Met à jour la réponse HTTP pour le client
        .then(book => res.status(201).json(book))
        .catch(error => res.status(500).json({ error }));
};