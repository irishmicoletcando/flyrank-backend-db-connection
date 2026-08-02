const express = require('express');
const sqlite = require('sqlite3').verbose();
const app = express();
const port = 3000;
app.use(express.json());

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

app.post('/tasks', async (req, res) => {
  const { title } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }
  const result = await new Promise((resolve, reject) => {
    db.run('INSERT INTO tasks (title) VALUES (?)', [title], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, title, done: false });
      }
    });
  });
  res.status(201).json(result); 
});

app.put('/tasks/:id', async (req, res) => {
  const taskId = req.params.id;
  const { title, done } = req.body;
  
  const isDoneValue = done === true ? 1 : 0;

  if (title !== undefined && title.trim() === '') {
    return res.status(400).json({ error: 'Title cannot be empty' });
  } 
  else if (done !== undefined && typeof done !== 'boolean') {
    return res.status(400).json({ error: 'Done must be a boolean' });
  } 
  else if (!taskId) {
    return res.status(400).json({ error: 'Task ID is required' });
  } 
  else if (title === undefined && done === undefined) {
    return res.status(400).json({ error: 'At least one of title or done must be provided' });
  } 
  else {
    db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, row) => {
        if (err) {
        return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
        return res.status(404).json({ error: 'Task not found' });
        }

        const updatedTitle = title !== undefined ? title : row.title;
        const updatedDone = done !== undefined ? isDoneValue : row.done;

        db.run('UPDATE tasks SET title = ?, done = ? WHERE id = ?', [updatedTitle, updatedDone, taskId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json({ id: taskId, title: updatedTitle, done: isDone(updatedDone) });
        });
    });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  const taskId = req.params.id;

  if (!taskId) {
    return res.status(400).json({ error: 'Task ID is required' });
  }

  db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.run('DELETE FROM tasks WHERE id = ?', [taskId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.sendStatus(204);
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});