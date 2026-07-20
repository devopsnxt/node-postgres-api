const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const usersRouter = require('./routes/users');
const app = express();

app.use(express.json());
app.use('/users', usersRouter);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'node-postgres-api is running' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
