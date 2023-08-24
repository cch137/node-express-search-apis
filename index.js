const { config: dotenvConfig } = require('dotenv');
const { app, server } = require('./server.js');
const router = require('./apis.js');

dotenvConfig()

router()

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is listening to http://localhost:${port}`);
});

app.use('*', (req, res) => res.status(404).end())
