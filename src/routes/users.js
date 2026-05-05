const router = require('express').Router();
const { getUsers, deleteUser } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, getUsers);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
