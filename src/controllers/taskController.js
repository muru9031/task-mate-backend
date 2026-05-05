const pool = require('../config/db');

const getTasks = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';
    const query = `
      SELECT t.*, 
        u1.name AS assigned_to_name, u1.email AS assigned_to_email,
        u2.name AS created_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      ${isAdmin ? '' : 'WHERE t.assigned_to = $1'}
      ORDER BY t.created_at DESC
    `;
    const result = await pool.query(query, isAdmin ? [] : [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, priority, status, due_date, type, assigned_to } = req.body;
    const result = await pool.query(
      `INSERT INTO tasks (title, description, priority, status, due_date, type, assigned_to, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [title, description, priority || 'Medium', status || 'Pending', due_date, type || 'individual', assigned_to, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { title, description, priority, status, due_date, assigned_to } = req.body;
    const result = await pool.query(
      `UPDATE tasks SET title=$1, description=$2, priority=$3, status=$4, due_date=$5, assigned_to=$6
       WHERE id=$7 RETURNING *`,
      [title, description, priority, status, due_date, assigned_to, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
