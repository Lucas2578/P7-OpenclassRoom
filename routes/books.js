const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const bookCtrl = require('../controllers/book');

router.get('/', bookCtrl.getAllBook);
router.get('/bestrating', bookCtrl.getBestRating);
router.post('/', auth, upload, upload.validateCreateBookFields, upload.processImage, bookCtrl.createBook);
router.get('/:id', bookCtrl.getOneBook);
router.put('/:id', auth, upload, upload.processImage, bookCtrl.updateBook);
router.delete('/:id', auth, bookCtrl.deleteBook);
router.post('/:id/rating', auth, bookCtrl.rateBook);

module.exports = router;