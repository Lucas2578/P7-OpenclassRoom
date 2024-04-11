const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// Schéma book
const bookSchema = mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  imageUrl: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  ratings: [
    {
        userId: { type: String, required: true, unique: true },
        grade: { type: Number, required: true },
    }
  ],
  averageRating: { type: Number, required: true },
});

bookSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Book', bookSchema);