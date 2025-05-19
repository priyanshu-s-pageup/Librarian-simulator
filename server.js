const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Serve uploaded files
server.use('/uploads', express.static(uploadsDir));

// Handle file uploads
server.post('/upload', (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send('No file uploaded');
  }

  const file = req.files.file;
  const filePath = path.join(uploadsDir, file.name);

  file.mv(filePath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json({ filename: file.name });
  });
});

server.use(router);
server.listen(3000, () => {
  console.log('JSON Server is running');
});