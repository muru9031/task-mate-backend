require('dotenv').config();
const express = require('express');
const cors = require('cors');

// init DB connection
require('./config/db');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://roaring-youtiao-278de8.netlify.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.options('*', cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Task Mate Backend Running'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/group-projects', require('./routes/groupProjects'));
app.use('/api/team-projects', require('./routes/teamProjects'));
app.use('/api/teams', require('./routes/teams'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
