const supabase = require('../config/supabase');

exports.getMessages = async (req, res) => {
  try {
    const { instanceId, chatId } = req.params;
    const userId = req.headers.userid || req.headers.userId; // Check both cases
    const { limit = 50, before } = req.query;

    console.log('Processing request with userId:', userId);

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

    let query = supabase
      .from('messages')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));

    if (before) {
      query = query.lt('timestamp', before);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    return res.status(200).json({
      messages: data.map(msg => ({
        id: msg.message_id,
        content: msg.content,
        sender: msg.sender,
        timestamp: msg.timestamp,
        isFromMe: msg.is_from_me,
        isAutoResponse: msg.is_auto_response || false
      }))
    });
  } catch (err) {
    console.error('Get messages error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { instanceId, chatId } = req.params;
    const { content } = req.body;
    const userId = req.headers.userId; // Assuming user ID is passed in headers after auth
    const io = req.app.get('io');

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
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

    const connections = req.app.locals.connections || new Map();

    if (!connections.has(instanceId)) {
      return res.status(400).json({ error: 'WhatsApp instance is not connected' });
    }

    const socket = connections.get(instanceId);

    const sentMessage = await socket.sendMessage(chatId, { text: content });

    const messageId = sentMessage.key.id;
    const timestamp = new Date().toISOString();

    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .insert([
        {
          instance_id: instanceId,
          chat_id: chatId,
          message_id: messageId,
          sender: socket.user.id,
          content,
          timestamp,
          is_from_me: true
        }
      ])
      .select();

    if (msgError) {
      console.error('Error storing message:', msgError);
      return res.status(500).json({ error: 'Failed to store message' });
    }

    io.to(`chat:${instanceId}:${chatId}`).emit('new_message', {
      instanceId,
      chatId,
      message: {
        id: messageId,
        sender: socket.user.id,
        content,
        timestamp,
        isFromMe: true
      }
    });

    return res.status(200).json({
      message: 'Message sent successfully',
      messageData: {
        id: messageId,
        content,
        timestamp,
        isFromMe: true
      }
    });
  } catch (err) {
    console.error('Send message error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const userId = req.headers.userId; // Assuming user ID is passed in headers after auth

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching message templates:', error);
      return res.status(500).json({ error: 'Failed to fetch message templates' });
    }

    return res.status(200).json({
      templates: data
    });
  } catch (err) {
    console.error('Get templates error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const { name, trigger, response, isActive = true } = req.body;
    const userId = req.headers.userId; // Assuming user ID is passed in headers after auth

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    if (!name || !trigger || !response) {
      return res.status(400).json({ error: 'Name, trigger, and response are required' });
    }

    const { data, error } = await supabase
      .from('message_templates')
      .insert([
        {
          user_id: userId,
          name,
          trigger,
          response,
          is_active: isActive
        }
      ])
      .select();

    if (error) {
      console.error('Error creating message template:', error);
      return res.status(500).json({ error: 'Failed to create message template' });
    }

    return res.status(201).json({
      message: 'Message template created successfully',
      template: data[0]
    });
  } catch (err) {
    console.error('Create template error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, trigger, response, isActive } = req.body;
    const userId = req.headers.userId; // Assuming user ID is passed in headers after auth

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const { data: template, error: fetchError } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', templateId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !template) {
      return res.status(404).json({ error: 'Message template not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (trigger !== undefined) updateData.trigger = trigger;
    if (response !== undefined) updateData.response = response;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabase
      .from('message_templates')
      .update(updateData)
      .eq('id', templateId)
      .select();

    if (error) {
      console.error('Error updating message template:', error);
      return res.status(500).json({ error: 'Failed to update message template' });
    }

    return res.status(200).json({
      message: 'Message template updated successfully',
      template: data[0]
    });
  } catch (err) {
    console.error('Update template error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.headers.userId; // Assuming user ID is passed in headers after auth

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const { data: template, error: fetchError } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', templateId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !template) {
      return res.status(404).json({ error: 'Message template not found' });
    }

    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting message template:', error);
      return res.status(500).json({ error: 'Failed to delete message template' });
    }

    return res.status(200).json({
      message: 'Message template deleted successfully'
    });
  } catch (err) {
    console.error('Delete template error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
