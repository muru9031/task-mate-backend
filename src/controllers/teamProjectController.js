const pool = require('../config/db');

const getTeamProjects = async (req, res) => {
  try {
    const projects = await pool.query(
      `SELECT tp.*, t.name AS team_name 
       FROM team_projects tp LEFT JOIN teams t ON tp.team_id = t.id 
       ORDER BY tp.created_at DESC`
    );
    const tasks = await pool.query(
      `SELECT tt.*, array_agg(u.name) AS member_names, array_agg(ttm.user_id) AS member_ids
       FROM team_tasks tt
       LEFT JOIN team_task_members ttm ON tt.id = ttm.task_id
       LEFT JOIN users u ON ttm.user_id = u.id
       GROUP BY tt.id ORDER BY tt.created_at`
    );
    const result = projects.rows.map(p => ({
      ...p,
      tasks: tasks.rows.filter(t => t.project_id === p.id)
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createTeamProject = async (req, res) => {
  try {
    const { title, description, priority, due_date, team_id } = req.body;
    const result = await pool.query(
      `INSERT INTO team_projects (title, description, priority, due_date, team_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, description, priority || 'Medium', due_date, team_id || null, req.user.id]
    );
    res.status(201).json({ ...result.rows[0], tasks: [] });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateTeamProject = async (req, res) => {
  try {
    const { title, description, priority, status, due_date, team_id } = req.body;
    const result = await pool.query(
      `UPDATE team_projects SET title=$1, description=$2, priority=$3, status=$4, due_date=$5, team_id=$6
       WHERE id=$7 RETURNING *`,
      [title, description, priority, status, due_date, team_id, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Project not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteTeamProject = async (req, res) => {
  try {
    await pool.query('DELETE FROM team_projects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addTeamTask = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, description, due_date, assigned_to } = req.body;
    const task = await client.query(
      `INSERT INTO team_tasks (project_id, name, description, due_date) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, name, description, due_date]
    );
    const taskId = task.rows[0].id;
    if (assigned_to?.length) {
      for (const userId of assigned_to) {
        await client.query('INSERT INTO team_task_members (task_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [taskId, userId]);
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ ...task.rows[0], member_ids: assigned_to || [] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
};

const updateTeamTask = async (req, res) => {
  try {
    const { name, description, status, due_date } = req.body;
    const result = await pool.query(
      `UPDATE team_tasks SET name=$1, description=$2, status=$3, due_date=$4 WHERE id=$5 RETURNING *`,
      [name, description, status, due_date, req.params.taskId]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteTeamTask = async (req, res) => {
  try {
    await pool.query('DELETE FROM team_tasks WHERE id = $1', [req.params.taskId]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTeamProjects, createTeamProject, updateTeamProject, deleteTeamProject, addTeamTask, updateTeamTask, deleteTeamTask };
