const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Document = require("./Document"); //  Document model
require('dotenv').config();

const app = express();

// Serve the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Handle all client-side routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});


const mongoUri = process.env.MONGODB_URI;
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Database connected'))
  .catch(e => console.error(e));


const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});


const allowedOrigins = [
  'https://64ce05628a3f381ad5193599--prismatic-malasada-9818c4.netlify.app',
  'http://localhost:5173'
];


const io = require("socket.io")(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});



io.on("connection", (socket) => {
  socket.on('get-document', async documentId => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit('load-document', document.data)

    socket.on('send-changes', delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on('save-document', async data => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

async function findOrCreateDocument(id){
    if(id == null) return;

    const document = await Document.findById(id);
    if(document) return document;
 
    return await Document.create({ _id: id, data: defaultValue });
}
