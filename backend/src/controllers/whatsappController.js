const supabase = require('../config/supabase');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('baileys');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

const connections = new Map();

exports.createInstance = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.headers.userId || req.headers.userid; // Check both cases

    if (!name) {
      return res.status(400).json({ error: 'Instance name is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .insert([
        {
          name,
          user_id: userId,
          status: 'disconnected'
        }
      ])
      .select();

    if (error) {
      console.error('Error creating WhatsApp instance:', error);
      return res.status(500).json({ error: 'Failed to create WhatsApp instance' });
    }

    const instanceId = data[0].id;

    const authDir = path.join(__dirname, '..', '..', 'auth', instanceId);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    return res.status(201).json({
      message: 'WhatsApp instance created successfully',
      instance: data[0]
    });
  } catch (err) {
    console.error('Create instance error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserInstances = async (req, res) => {
  try {
    const userId = req.headers.userId || req.headers.userid; // Check both cases

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching WhatsApp instances:', error);
      return res.status(500).json({ error: 'Failed to fetch WhatsApp instances' });
    }

    return res.status(200).json({
      instances: data
    });
  } catch (err) {
    console.error('Get user instances error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getInstance = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const userId = req.headers.userId || req.headers.userid; // Check both cases

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching WhatsApp instance:', error);
      return res.status(404).json({ error: 'WhatsApp instance not found' });
    }

    return res.status(200).json({
      instance: data
    });
  } catch (err) {
    console.error('Get instance error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteInstance = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const userId = req.headers.userId || req.headers.userid; // Check both cases

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !instance) {
      return res.status(404).json({ error: 'WhatsApp instance not found' });
    }

    if (connections.has(instanceId)) {
      const socket = connections.get(instanceId);
      socket.logout();
      connections.delete(instanceId);
    }

    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      console.error('Error deleting WhatsApp instance:', deleteError);
      return res.status(500).json({ error: 'Failed to delete WhatsApp instance' });
    }

    const authDir = path.join(__dirname, '..', '..', 'auth', instanceId);
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }

    return res.status(200).json({
      message: 'WhatsApp instance deleted successfully'
    });
  } catch (err) {
    console.error('Delete instance error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.generateQR = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const userId = req.headers.userId || req.headers.userid; // Check both cases
    const io = req.app.get('io');

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !instance) {
      return res.status(404).json({ error: 'WhatsApp instance not found' });
    }

    const authDir = path.join(__dirname, '..', '..', 'auth', instanceId);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: true
    });

    connections.set(instanceId, socket);

    await supabase
      .from('whatsapp_instances')
      .update({ status: 'connecting' })
      .eq('id', instanceId);

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        qrcodeTerminal.generate(qr, { small: true });
        
        qrcode.toDataURL(qr, (err, url) => {
          if (err) {
            console.error('Error generating QR code image:', err);
            return;
          }
          
          const base64Data = url.split(',')[1];
          
          io.to(`instance:${instanceId}`).emit('qr_code', { 
            instanceId, 
            qr: base64Data 
          });
        });
      }
      
      if (connection === 'open') {
        console.log(`WhatsApp instance ${instanceId} connected!`);
        
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
          
          io.to(`instance:${instanceId}`).emit('connection_status', {
            instanceId,
            status: 'disconnected'
          });
        } else {
          console.log(`WhatsApp instance ${instanceId} disconnected, will reconnect`);
          
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

    return res.status(200).json({
      message: 'WhatsApp QR code generation initiated',
      instance: {
        id: instanceId,
        status: 'connecting'
      }
    });
  } catch (err) {
    console.error('Generate QR error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const userId = req.headers.userId || req.headers.userid; // Check both cases

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !instance) {
      return res.status(404).json({ error: 'WhatsApp instance not found' });
    }

    const isConnected = connections.has(instanceId);
    const status = isConnected ? instance.status : 'disconnected';

    return res.status(200).json({
      instanceId,
      status,
      phoneNumber: instance.phone_number,
      lastConnected: instance.last_connected,
      lastDisconnected: instance.last_disconnected
    });
  } catch (err) {
    console.error('Get status error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getChats = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const userId = req.headers.userId || req.headers.userid; // Check both cases

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !instance) {
      return res.status(404).json({ error: 'WhatsApp instance not found' });
    }

    if (!connections.has(instanceId)) {
      return res.status(400).json({ error: 'WhatsApp instance is not connected' });
    }

    const socket = connections.get(instanceId);
    
    const chats = await socket.getChats();
    
    return res.status(200).json({
      chats: chats.map(chat => ({
        id: chat.id,
        name: chat.name,
        lastMessageTime: chat.lastMessageTime,
        unreadCount: chat.unreadCount
      }))
    });
  } catch (err) {
    console.error('Get chats error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getContacts = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const userId = req.headers.userId || req.headers.userid; // Check both cases

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !instance) {
      return res.status(404).json({ error: 'WhatsApp instance not found' });
    }

    if (!connections.has(instanceId)) {
      return res.status(400).json({ error: 'WhatsApp instance is not connected' });
    }

    const socket = connections.get(instanceId);
    
    const contacts = await socket.getContacts();
    
    return res.status(200).json({
      contacts: Object.values(contacts).map(contact => ({
        id: contact.id,
        name: contact.name || contact.notify || contact.verifiedName,
        pushName: contact.pushName,
        status: contact.status
      }))
    });
  } catch (err) {
    console.error('Get contacts error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
