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

module.exports.validateCreateBookFields = (req, res, next) => {
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
  } else {
      next();
  }
};

module.exports.processImage = (req, res, next) => {
  if (req.file) {
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

                  // Mettre à jour les données du livre dans req.body.book si nécessaire
                  const bookObject = JSON.parse(req.body.book);
                  bookObject.imageUrl = `${req.protocol}://${req.get('host')}/${outputFilePath}`;
                  req.body.book = JSON.stringify(bookObject);

                  next();
              });
          })
          .catch(err => {
              return next(err);
          });
  } else {
      next();
  }
};