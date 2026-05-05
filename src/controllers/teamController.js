const pool = require('../config/db');

const getTeams = async (req, res) => {
  try {
    const teams = await pool.query('SELECT * FROM teams ORDER BY created_at DESC');
    const members = await pool.query(
      `SELECT tm.team_id, u.id, u.name, u.email 
       FROM team_members tm JOIN users u ON tm.user_id = u.id`
    );
    const result = teams.rows.map(team => ({
      ...team,
      members: members.rows.filter(m => m.team_id === team.id)
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createTeam = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, members } = req.body;
    const team = await client.query(
      'INSERT INTO teams (name, created_by) VALUES ($1, $2) RETURNING *',
      [name, req.user.id]
    );
    const teamId = team.rows[0].id;
    if (members?.length) {
      for (const userId of members) {
        await client.query('INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [teamId, userId]);
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ ...team.rows[0], members: members || [] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
};

const addMember = async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, req.body.userId]
    );
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteTeam = async (req, res) => {
  try {
    await pool.query('DELETE FROM teams WHERE id = $1', [req.params.id]);
    res.json({ message: 'Team deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTeams, createTeam, addMember, deleteTeam };
