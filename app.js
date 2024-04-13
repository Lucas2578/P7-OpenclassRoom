const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const userRoutes = require('./routes/user');
const bookRoutes = require('./routes/books');
// On importe les informations de connexion
const { user, password } = require('./utils/credentials');

// Connecte l'application à la base de données MongoDB
mongoose.connect(`mongodb+srv://${user}:${password}@cluster0.g4bmxef.mongodb.net/?retryWrites=true&w=majority`,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();

// Middleware pour comprendre les données JSON envoyées dans les requêtes
app.use(express.json());

// Middleware express qui définit des en-têtes CORS pour permettre les requêtes HTTP entre différentes origines
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/api/auth', userRoutes);
app.use('/api/books', bookRoutes);

module.exports = app;