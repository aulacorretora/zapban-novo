const supabase = require('../config/supabase');

/**
 * Handle Hotmart webhook for subscription status changes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleHotmartWebhook = async (req, res) => {
  try {
    const { email, name, status, transaction } = req.body;

    if (!email || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    console.log(`Received Hotmart webhook for ${email} with status: ${status}`);

    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    let userId;

    if (userError || !existingUser) {
      console.log(`User not found, creating new user for: ${email}`);
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          name: name || email.split('@')[0],
          role: 'user'
        },
        password: Math.random().toString(36).slice(-10) // Senha aleatória temporária
      });
      
      if (authError) {
        console.error('Error creating auth user:', authError);
        return res.status(500).json({ 
          success: false, 
          message: 'Error creating user' 
        });
      }
      
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email,
          name: name || email.split('@')[0],
          active: true,
          role: 'user',
          subscription_status: status,
          subscription_updated_at: new Date().toISOString(),
          transaction_id: transaction?.id || null
        }])
        .select()
        .single();
        
      if (profileError) {
        console.error('Error creating user profile:', profileError);
        return res.status(500).json({ 
          success: false, 
          message: 'Error creating user profile' 
        });
      }
      
      userId = userData.id;
      
      const { error: instanceError } = await supabase
        .from('whatsapp_instances')
        .insert([{
          user_id: userId,
          name: 'Instância Principal',
          status: 'disconnected'
        }]);
        
      if (instanceError) {
        console.error('Error creating default instance:', instanceError);
      }
    } else {
      userId = existingUser.id;
      
      const isActive = ['approved', 'active', 'completed'].includes(status.toLowerCase());
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          active: isActive,
          subscription_status: status,
          subscription_updated_at: new Date().toISOString(),
          transaction_id: transaction?.id || null
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error updating user status:', updateError);
        return res.status(500).json({ 
          success: false, 
          message: 'Error updating user status' 
        });
      }
    }

    await supabase
      .from('webhook_logs')
      .insert({
        provider: 'hotmart',
        event_type: status,
        user_id: userId,
        payload: req.body,
        processed_at: new Date().toISOString()
      });

    return res.status(200).json({ 
      success: true, 
      message: `User processed successfully with status: ${status}` 
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};
