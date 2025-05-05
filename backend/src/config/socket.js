const { Server } = require('socket.io');

function setupSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: '*', // In production, restrict this to your frontend domain
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_instance', (instanceId) => {
      socket.join(`instance:${instanceId}`);
      console.log(`Socket ${socket.id} joined instance room: ${instanceId}`);
    });

    socket.on('join_chat', ({ instanceId, chatId }) => {
      socket.join(`chat:${instanceId}:${chatId}`);
      console.log(`Socket ${socket.id} joined chat room: ${instanceId}:${chatId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = setupSocketIO;
