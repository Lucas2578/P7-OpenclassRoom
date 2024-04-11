const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const bookCtrl = require('../controllers/book');

router.get('/');
router.get('/:id', bookCtrl.getOneBook);
router.get('/bestrating');
router.post('/', auth, upload, upload.resizeAndReplaceImage, bookCtrl.createBook);
router.put('/:id', auth);
router.delete('/:id', auth);
router.post('/:id/rating', auth);

module.exports = router;