require('dotenv').config();

const app = require('./src/config/app');

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Alebourg API escuchando en http://localhost:${PORT}`);
});
