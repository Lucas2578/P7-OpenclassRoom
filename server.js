const http = require('http');
const app = require('./app');

// Fonction pour normaliser le port en un nombre ou une chaîne de caractères
const normalizePort = val => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};

// On définit le port sur celui de l'environnement s'il est défini, sinon, par défaut 3000
const port = normalizePort(process.env.PORT || '4000');
app.set('port', port);

// Fonction de gestion des erreurs
const errorHandler = error => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  // On initialise une constante avec l'adresse et le port du serveur
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
  switch (error.code) {
    // Gère une erreur de permission insuffisante
    case 'EACCES':
      console.error(bind + ' requires elevated privileges.');
      process.exit(1);
      break;
    // Gère une erreur de port déjà utilisé
    case 'EADDRINUSE':
      console.error(bind + ' is already in use.');
      process.exit(1);
      break;
    // Pour les autres erreurs ça renvoie simplement l'erreur
    default:
      throw error;
  }
};

// J'initialise dans une constante la création de mon serveur HTTP
const server = http.createServer(app);

// Gère les erreurs potentielles du serveur
server.on('error', errorHandler);

// Le serveur écoute les connexions
server.on('listening', () => {
  // On obtient l'adresse et le port du serveur
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
  // Affiche un message qui indique sur quel adresse/quel port le serveur écoute
  console.log('Listening on ' + bind);
});

// On démarre le serveur pour qu'il écoute sur le port que l'on indique
server.listen(port);