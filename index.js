const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const contactRouter = require('./routes/contact');
const usersRouter = require('./routes/users');
const app = express();

app.use(express.json());
app.use('/contact', contactRouter);
app.use('/users', usersRouter);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'node-postgres-api is running' });
});

const port = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });
}

module.exports = app;
