const express = require('express');
const sqlite = require('sqlite3').verbose();
const app = express();
const port = 3000;

const db = new sqlite.Database('./tasks.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database')

        db.run(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                done INTEGER NOT NULL DEFAULT 0
            )
        `)
    }
})

app.get('/tasks', async (req, res) => {
  const tasks = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM tasks', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
  res.json(tasks);
});
  
app.get('/tasks/:id', async (req, res) => {
  const taskId = req.params.id;
  const task = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
  if (task) {
    res.json(task);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
}); 

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});