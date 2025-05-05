const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

exports.getUsers = async (req, res) => {
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    const { data: instances, error: instancesError } = await supabase
      .from('whatsapp_instances')
      .select('user_id, id');

    if (instancesError) {
      console.error('Error fetching instances:', instancesError);
      return res.status(500).json({ error: 'Failed to fetch instances' });
    }

    const instanceCounts = {};
    instances.forEach(instance => {
      instanceCounts[instance.user_id] = (instanceCounts[instance.user_id] || 0) + 1;
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      active: user.active,
      role: user.role || 'user',
      createdAt: user.created_at,
      instances: instanceCounts[user.id] || 0
    }));

    return res.status(200).json({ users: formattedUsers });
  } catch (error) {
    console.error('Error in getUsers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getInstances = async (req, res) => {
  try {
    const { data: instances, error } = await supabase
      .from('whatsapp_instances')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email
        )
      `);

    if (error) {
      console.error('Error fetching instances:', error);
      return res.status(500).json({ error: 'Failed to fetch instances' });
    }

    const { data: messageCounts, error: countError } = await supabase
      .from('messages')
      .select('instance_id, count')
      .select('instance_id, count')
      .group('instance_id');

    if (countError) {
      console.error('Error fetching message counts:', countError);
    }

    const messageCountMap = {};
    if (messageCounts) {
      messageCounts.forEach(item => {
        messageCountMap[item.instance_id] = parseInt(item.count);
      });
    }

    const formattedInstances = instances.map(instance => ({
      id: instance.id,
      name: instance.name,
      userId: instance.user_id,
      userName: instance.users?.name || instance.users?.email?.split('@')[0] || 'Unknown',
      status: instance.status,
      createdAt: instance.created_at,
      messagesCount: messageCountMap[instance.id] || 0
    }));

    return res.status(200).json({ instances: formattedInstances });
  } catch (error) {
    console.error('Error in getInstances:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.toggleUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { active } = req.body;

  if (active === undefined) {
    return res.status(400).json({ error: 'Active status is required' });
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({ active })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user status:', error);
      return res.status(500).json({ error: 'Failed to update user status' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in toggleUserStatus:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const { error: instanceError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('user_id', userId);

    if (instanceError) {
      console.error('Error deleting user instances:', instanceError);
      return res.status(500).json({ error: 'Failed to delete user instances' });
    }

    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) {
      console.error('Error deleting user:', userError);
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteInstance = async (req, res) => {
  const { instanceId } = req.params;

  try {
    const { error } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (error) {
      console.error('Error deleting instance:', error);
      return res.status(500).json({ error: 'Failed to delete instance' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in deleteInstance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.exportData = async (req, res) => {
  const { type } = req.params;
  const validTypes = ['users', 'instances', 'messages'];

  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid export type' });
  }

  try {
    let data;
    let filename;

    switch (type) {
      case 'users':
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*');

        if (usersError) {
          console.error('Error fetching users for export:', usersError);
          return res.status(500).json({ error: 'Failed to export users' });
        }

        data = users;
        filename = `users_export_${Date.now()}.json`;
        break;

      case 'instances':
        const { data: instances, error: instancesError } = await supabase
          .from('whatsapp_instances')
          .select(`
            *,
            users:user_id (
              id,
              name,
              email
            )
          `);

        if (instancesError) {
          console.error('Error fetching instances for export:', instancesError);
          return res.status(500).json({ error: 'Failed to export instances' });
        }

        data = instances;
        filename = `instances_export_${Date.now()}.json`;
        break;

      case 'messages':
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .limit(1000); // Limitar para evitar exportações muito grandes

        if (messagesError) {
          console.error('Error fetching messages for export:', messagesError);
          return res.status(500).json({ error: 'Failed to export messages' });
        }

        data = messages;
        filename = `messages_export_${Date.now()}.json`;
        break;
    }

    const exportId = uuidv4();
    const downloadUrl = `/api/admin/download/${exportId}`;


    return res.status(200).json({ url: downloadUrl });
  } catch (error) {
    console.error('Error in exportData:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
