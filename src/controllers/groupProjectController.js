const pool = require('../config/db');

const getGroupProjects = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';
    let projects;
    if (isAdmin) {
      projects = await pool.query('SELECT * FROM group_projects ORDER BY created_at DESC');
    } else {
      projects = await pool.query(
        `SELECT gp.* FROM group_projects gp
         JOIN group_project_members gpm ON gp.id = gpm.project_id
         WHERE gpm.user_id = $1 ORDER BY gp.created_at DESC`,
        [req.user.id]
      );
    }
    const members = await pool.query(
      `SELECT gpm.project_id, u.id, u.name, u.email
       FROM group_project_members gpm JOIN users u ON gpm.user_id = u.id`
    );
    const result = projects.rows.map(p => ({
      ...p,
      assigned_to: members.rows.filter(m => m.project_id === p.id)
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createGroupProject = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { title, description, due_date, assigned_to } = req.body;
    const project = await client.query(
      'INSERT INTO group_projects (title, description, due_date, created_by) VALUES ($1,$2,$3,$4) RETURNING *',
      [title, description, due_date, req.user.id]
    );
    const projectId = project.rows[0].id;
    if (assigned_to?.length) {
      for (const userId of assigned_to) {
        await client.query('INSERT INTO group_project_members (project_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [projectId, userId]);
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ ...project.rows[0], assigned_to: assigned_to || [] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
};

const deleteGroupProject = async (req, res) => {
  try {
    await pool.query('DELETE FROM group_projects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getGroupProjects, createGroupProject, deleteGroupProject };
