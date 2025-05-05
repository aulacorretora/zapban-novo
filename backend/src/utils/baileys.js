const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('baileys');
const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');

const connections = new Map();
const reconnectAttempts = new Map();
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 segundos

async function initializeWhatsApp(instanceId, userId, io) {
  try {
    const authDir = path.join(__dirname, '..', '..', 'auth', instanceId);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    reconnectAttempts.set(instanceId, 0);

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      connectTimeoutMs: 60000, // 60 segundos
      keepAliveIntervalMs: 25000, // 25 segundos
      retryRequestDelayMs: 2000 // 2 segundos
    });

    connections.set(instanceId, socket);

    await supabase
      .from('whatsapp_instances')
      .update({ status: 'connecting' })
      .eq('id', instanceId);

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      console.log('Connection update:', { connection, qr: !!qr, instanceId });
      
      if (connection) {
        io.to(`instance:${instanceId}`).emit('connection_status', {
          instanceId,
          status: connection
        });
      }
      
      if (qr) {
        console.log(`QR code generated for instance ${instanceId}`);
        
        try {
          const qrcode = require('qrcode');
          qrcode.toDataURL(qr, (err, url) => {
            if (err) {
              console.error('Error generating QR code image:', err);
              io.to(`instance:${instanceId}`).emit('connection_status', {
                instanceId,
                status: 'error',
                error: 'Failed to generate QR code'
              });
              return;
            }
            
            try {
              const base64Data = url.split(',')[1];
              
              io.to(`instance:${instanceId}`).emit('qr_code', { 
                instanceId, 
                qr: base64Data 
              });
              
              console.log(`QR code emitted successfully for instance ${instanceId}`);
            } catch (emitError) {
              console.error('Error emitting QR code:', emitError);
              io.to(`instance:${instanceId}`).emit('connection_status', {
                instanceId,
                status: 'error',
                error: 'Failed to process QR code'
              });
            }
          });
        } catch (qrError) {
          console.error('Error in QR code generation process:', qrError);
          io.to(`instance:${instanceId}`).emit('connection_status', {
            instanceId,
            status: 'error',
            error: 'QR code generation failed'
          });
        }
        
        reconnectAttempts.set(instanceId, 0);
      }
      
      if (connection === 'open') {
        console.log(`WhatsApp instance ${instanceId} connected!`);
        
        reconnectAttempts.set(instanceId, 0);
        
        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'connected',
            phone_number: socket.user?.id?.split(':')[0] || null,
            last_connected: new Date().toISOString()
          })
          .eq('id', instanceId);
          
        io.to(`instance:${instanceId}`).emit('connection_status', {
          instanceId,
          status: 'connected'
        });
      }
      
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const attempts = reconnectAttempts.get(instanceId) || 0;
        
        if (statusCode === DisconnectReason.loggedOut) {
          console.log(`WhatsApp instance ${instanceId} logged out`);
          
          await supabase
            .from('whatsapp_instances')
            .update({
              status: 'disconnected',
              last_disconnected: new Date().toISOString()
            })
            .eq('id', instanceId);
            
          connections.delete(instanceId);
          reconnectAttempts.delete(instanceId);
          
          io.to(`instance:${instanceId}`).emit('connection_status', {
            instanceId,
            status: 'disconnected'
          });
        } else if (attempts < MAX_RECONNECT_ATTEMPTS) {
          console.log(`WhatsApp instance ${instanceId} disconnected, attempting reconnect (${attempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectAttempts.set(instanceId, attempts + 1);
          
          await supabase
            .from('whatsapp_instances')
            .update({
              status: 'reconnecting',
              last_disconnected: new Date().toISOString()
            })
            .eq('id', instanceId);
            
          io.to(`instance:${instanceId}`).emit('connection_status', {
            instanceId,
            status: 'reconnecting'
          });
          
          setTimeout(async () => {
            try {
              if (connections.has(instanceId)) {
                console.log(`Attempting to reconnect instance ${instanceId}...`);
                
                connections.delete(instanceId);
                
                await initializeWhatsApp(instanceId, userId, io);
              }
            } catch (error) {
              console.error(`Error reconnecting instance ${instanceId}:`, error);
              
              io.to(`instance:${instanceId}`).emit('connection_status', {
                instanceId,
                status: 'error',
                error: 'Failed to reconnect'
              });
            }
          }, RECONNECT_DELAY);
        } else {
          console.log(`WhatsApp instance ${instanceId} failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
          
          await supabase
            .from('whatsapp_instances')
            .update({
              status: 'disconnected',
              last_disconnected: new Date().toISOString()
            })
            .eq('id', instanceId);
            
          connections.delete(instanceId);
          reconnectAttempts.delete(instanceId);
          
          io.to(`instance:${instanceId}`).emit('connection_status', {
            instanceId,
            status: 'disconnected',
            error: 'Max reconnect attempts reached'
          });
        }
      }
    });

    socket.ev.on('messages.upsert', async (m) => {
      if (m.type === 'notify') {
        for (const msg of m.messages) {
          if (!msg.key.fromMe) {
            console.log('Received message:', msg);
            
            const { error: msgError } = await supabase
              .from('messages')
              .insert([
                {
                  instance_id: instanceId,
                  chat_id: msg.key.remoteJid,
                  message_id: msg.key.id,
                  sender: msg.key.participant || msg.key.remoteJid,
                  content: msg.message?.conversation || 
                           msg.message?.extendedTextMessage?.text || 
                           JSON.stringify(msg.message),
                  timestamp: new Date(msg.messageTimestamp * 1000).toISOString(),
                  is_from_me: false
                }
              ]);
              
            if (msgError) {
              console.error('Error storing message:', msgError);
            }
            
            io.to(`chat:${instanceId}:${msg.key.remoteJid}`).emit('new_message', {
              instanceId,
              chatId: msg.key.remoteJid,
              message: {
                id: msg.key.id,
                sender: msg.key.participant || msg.key.remoteJid,
                content: msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text || 
                         JSON.stringify(msg.message),
                timestamp: new Date(msg.messageTimestamp * 1000).toISOString(),
                isFromMe: false
              }
            });
            
            const { data: templates, error: templatesError } = await supabase
              .from('message_templates')
              .select('*')
              .eq('user_id', userId)
              .eq('is_active', true);
              
            if (!templatesError && templates.length > 0) {
              const messageContent = msg.message?.conversation || 
                                    msg.message?.extendedTextMessage?.text || '';
                                    
              for (const template of templates) {
                if (messageContent.toLowerCase().includes(template.trigger.toLowerCase())) {
                  await socket.sendMessage(msg.key.remoteJid, { text: template.response });
                  
                  await supabase
                    .from('messages')
                    .insert([
                      {
                        instance_id: instanceId,
                        chat_id: msg.key.remoteJid,
                        message_id: `auto-${Date.now()}`,
                        sender: socket.user.id,
                        content: template.response,
                        timestamp: new Date().toISOString(),
                        is_from_me: true,
                        is_auto_response: true
                      }
                    ]);
                    
                  break; // Only send the first matching auto-response
                }
              }
            }
          }
        }
      }
    });

    socket.ev.on('creds.update', saveCreds);

    return socket;
  } catch (error) {
    console.error('Error initializing WhatsApp:', error);
    throw error;
  }
}

function getConnection(instanceId) {
  return connections.get(instanceId);
}

async function closeConnection(instanceId) {
  if (connections.has(instanceId)) {
    const socket = connections.get(instanceId);
    await socket.logout();
    connections.delete(instanceId);
    return true;
  }
  return false;
}

module.exports = {
  connections,
  initializeWhatsApp,
  getConnection,
  closeConnection
};
