const mongoose = require('mongoose');
const Document = require("./Document"); 
require('dotenv').config();


const mongoUri = process.env.MONGODB_URI
const BASE_URL = process.env.BASE_URL
const SOCKETIO_PORT = process.env.SOCKETIO_PORT || 3001

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Database connected'))
  .catch(e => console.error(e));

const allowedOrigins = [
  'https://64ce014fdad64a1cf92baace--prismatic-malasada-9818c4.netlify.app',
  'http://localhost:5173'
];
  

const io = require("socket.io")(SOCKETIO_PORT, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

const defaultValue = "";

io.on("connection", (socket) => {

  socket.on('get-document', async documentId => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit('load-document', document.data)

    socket.on('send-changes', delta => {
      // console.log(delta);
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on('save-document', async data => {
      await Document.findByIdAndUpdate(documentId, {data})
    })
  })
  
  // console.log("connected");
}); 


async function findOrCreateDocument(id){
    if(id==null) return;

    const document = await Document.findById(id);
    if(document) return document;
 
    return await Document.create({_id: id, data: defaultValue})
}