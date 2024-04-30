const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

const storage = multer.diskStorage({
    // On défini ici la configuration de stockage pour Multer
    destination: (req, file, callback) => {
        callback(null, 'images')
    },
    // Ici on défini le nom du fichier pour les fichiers téléchargés
    filename: (req, file, callback) => {
        // Création d'un nom unique en utilisant un nombre aléatoire entre 0 et 1Md (exclu) que je multiplie par 1E9, et j'arrondit le nombre à l'entier le plus proche
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // On obtient l'extension du fichier à partir du type MIME
        const extension = MIME_TYPES[file.mimetype];
        // Ici, on construit le nom du fichier avec l'extension approprié
        callback(null, uniqueSuffix + '.' + extension);
    }
});

// On indique "storage" pour spécifier où les fichiers téléchargés doivent être enregistrés
// On indique également ".single('image')" de s'attendre à un seul fichier pour le champ de formulaire nommé "image"
module.exports = multer({storage: storage}).single('image');

module.exports.resizeAndReplaceImage = (req, res, next) => {
    // On vérifie si une image est dans la requête
    if (!req.file) {
        return res.status(400).json({ message: 'Ajouter une image est obligatoire !' });
    }

    // On initialise une constante qui comporte le corps de la requête du formulaire book
    // On utilise JSON.parse() pour transformer les données JSON en objet JavaScript
    const bookObject = JSON.parse(req.body.book);

    // Vérification si tous les champs obligatoires sont remplis
    if (!bookObject.title || !bookObject.author || !bookObject.year || !bookObject.genre || !req.file) {
        // Si un champ est manquant, on supprime le fichier téléchargé et on retourne une réponse d'erreur
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.log(err);
            }
            return res.status(400).json({ message: 'Tous les champs sont obligatoires !' });
        });
    } else {
        // Si tous les champs obligatoires sont remplis, procéder au redimensionnement de l'image
        const filePath = req.file.path;
        const fileName = req.file.filename;
        const outputFilePath = path.join('images', `resized_${fileName}`);

        sharp(filePath)
            .resize(206, 260)
            .toFile(outputFilePath)
            .then(() => {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.log(err);
                    }
                    req.file.path = outputFilePath;
                    next();
                });
            })
            .catch(err => {
                return next();
            });
    }
};