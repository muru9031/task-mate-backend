const router = require('express').Router();
const { getGroupProjects, createGroupProject, deleteGroupProject } = require('../controllers/groupProjectController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, getGroupProjects);
router.post('/', protect, adminOnly, createGroupProject);
router.delete('/:id', protect, adminOnly, deleteGroupProject);

module.exports = router;
