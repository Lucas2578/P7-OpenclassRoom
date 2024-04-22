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
    // On vérifie si l'image a été téléchargée
    if (!req.file) {
      return next();
    }
  
    // Chemin du fichier téléchargé
    const filePath = req.file.path;
    const fileName = req.file.filename;
    const outputFilePath = path.join('images', `resized_${fileName}`);
  
    // On redimensionne l'image et on écrit le fichier redimensionné sur le système de fichiers
    sharp(filePath)
      .resize(206, 260)
      .toFile(outputFilePath)
        .then(() => {
            // Ici, on remplace le fichier original par celui redimensionné
            // fs.unlink est utilisée pour supprimer des fichiers
            fs.unlink(filePath, (err) => {
                if (err) {
                  console.log(err);
                }
              // On met à jour le chemin de req.file.path
              req.file.path = outputFilePath;
              // On exécute le prochain middleware
              next();
            });
          })
          .catch(err => {
            return next();
          });
};