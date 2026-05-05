const router = require('express').Router();
const {
  getTeamProjects, createTeamProject, updateTeamProject, deleteTeamProject,
  addTeamTask, updateTeamTask, deleteTeamTask
} = require('../controllers/teamProjectController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, getTeamProjects);
router.post('/', protect, adminOnly, createTeamProject);
router.put('/:id', protect, adminOnly, updateTeamProject);
router.delete('/:id', protect, adminOnly, deleteTeamProject);

router.post('/:id/tasks', protect, adminOnly, addTeamTask);
router.put('/:id/tasks/:taskId', protect, updateTeamTask);
router.delete('/:id/tasks/:taskId', protect, adminOnly, deleteTeamTask);

module.exports = router;
