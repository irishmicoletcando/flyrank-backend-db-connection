const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

let taskList = [
  {
    "id": 1,
    "title": "Buy grocery",
    "done": true,
  },
  {
    "id": 2,
    "title": "Clean work area",
    "done": false,
  },
  {
    "id": 3,
    "title": "Wash dishes",
    "done": false,
  },
]

// create an Express app
const app = express();

// parsing JSON bodies
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const port = 3000;

// Root endpoint
app.get('/', (req, res) => {
  return res.json({
    name: 'Task API',
    version: '1.0',
    endpoints: ["/tasks"],
  });
});

// Get all tasks
app.get('/tasks', (req, res) => {
  return res.json(taskList);
});

// Get a specific task by ID
app.get('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = taskList.find(t => t.id === taskId);

  if (task) {
    return res.status(200).json(task);
  } else {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }
});

// Add a new task
app.post('/tasks', (req, res) => {
  const { title } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Invalid task data' });
  }

  // Generate a new unique ID for the task
  const taskId = taskList.length > 0 
    ? Math.max(...taskList.map(task => task.id)) + 1
    : 1;

  const newTask = {
    id: taskId,
    title,
    done: false,
  };

  taskList.push(newTask);
  return res.status(201).json(newTask);
});

// Update an existing task
app.put('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const { title, done } = req.body;

  const taskIndex = taskList.findIndex(t => t.id === taskId);

  // Validate the input data
  if (taskIndex === -1) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  } 
  // Check if title is provided and is an empty string, or if done is not a boolean
  else if (
    (title !== undefined && title.trim() === "") || 
    (done !== undefined && typeof done !== 'boolean')
  ) {
    return res.status(400).json({ error: 'Invalid task data' });
  } 
  else if (title === undefined && done === undefined) {
    return res.status(400).json({ error: 'No data provided for update' });
  }
  // Update the task if valid data is provided
  else {
    if (title !== undefined) {
      taskList[taskIndex].title = title;
    }
    if (done !== undefined) {
      taskList[taskIndex].done = done;
    }
    return res.status(200).json(taskList[taskIndex]);
  }
});

// Delete a task
app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = taskList.findIndex(t => t.id === taskId);

  if (taskIndex !== -1) {
    taskList.splice(taskIndex, 1);
    return res.sendStatus(204);
  } else {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  return res.json({
    status: 'ok',
  });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
