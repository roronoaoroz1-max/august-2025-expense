const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const db = new sqlite3.Database(':memory:'); // Change to file-based DB if needed

app.use(cors());
app.use(bodyParser.json());

// Create tables
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY, name TEXT UNIQUE)");
  db.run("CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY, date TEXT, time TEXT, remark TEXT, category TEXT, cash_in REAL, cash_out REAL, balance REAL)");
});

// Get categories
app.post('/api/getCategories', (req, res) => {
  db.all("SELECT name FROM categories", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(row => row.name));
  });
});

// Add category
app.post('/api/addCategory', (req, res) => {
  const { category } = req.body;
  db.run("INSERT INTO categories (name) VALUES (?)", [category], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Add transaction
app.post('/api/addTransaction', (req, res) => {
  const { date, time, remark, category, cashIn, cashOut } = req.body;
  const balance = (cashIn || 0) - (cashOut || 0);
  db.run("INSERT INTO transactions (date, time, remark, category, cash_in, cash_out, balance) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [date, time, remark, category, cashIn, cashOut, balance],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

// Get summary
app.post('/api/getSummary', (req, res) => {
  db.get("SELECT SUM(cash_in) AS totalCashIn, SUM(cash_out) AS totalCashOut, SUM(balance) AS finalBalance FROM transactions", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

// Get all transactions
app.post('/api/getTransactions', (req, res) => {
  db.all("SELECT * FROM transactions ORDER BY date DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Start server
const port = 3000;
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
