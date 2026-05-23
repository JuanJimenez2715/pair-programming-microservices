const express = require('express');
const app = express();

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ms-metrics' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ms-metrics running on port ${PORT}`));
