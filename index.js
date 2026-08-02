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

const isDone = (done) => {
  if (done === 1) {
    return true;
  } else {
    return false;
  }
}

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
  res.json(tasks.map(task => ({
    id: task.id,
    title: task.title,
    done: isDone(task.done)
  })));
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
    res.json({
      id: task.id,
      title: task.title,
      done: isDone(task.done)
    });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
}); 

app.post('/tasks', express.json(), async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const result = await new Promise((resolve, reject) => {
    db.run('INSERT INTO tasks (title) VALUES (?)', [title], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, title, done: 0 });
      }
    });
  });
  res.status(201).json(result); 
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});