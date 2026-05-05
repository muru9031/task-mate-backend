const router = require('express').Router();
const { getTeams, createTeam, addMember, deleteTeam } = require('../controllers/teamController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, getTeams);
router.post('/', protect, adminOnly, createTeam);
router.put('/:id/members', protect, adminOnly, addMember);
router.delete('/:id', protect, adminOnly, deleteTeam);

module.exports = router;
