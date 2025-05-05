const supabase = require('./src/config/supabase');

async function testWebhook() {
  try {
    console.log('Testing webhook functionality...');
    
    // Test 1: Create a test user directly in the database
    const testEmail = 'test-webhook@example.com';
    const testName = 'Test Webhook User';
    
    console.log(`Creating test user: ${testEmail}`);
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', testEmail)
      .single();
    
    let userId;
    
    if (existingUser) {
      console.log('User already exists, updating status');
      userId = existingUser.id;
      
      // Update user status
      await supabase
        .from('users')
        .update({
          active: true,
          subscription_status: 'approved',
          subscription_updated_at: new Date().toISOString(),
          transaction_id: 'test-transaction-123'
        })
        .eq('id', userId);
      
      console.log('User status updated successfully');
    } else {
      console.log('Creating new test user');
      
      // Create user directly in the database
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          email: testEmail,
          name: testName,
          active: true,
          role: 'user',
          subscription_status: 'approved',
          subscription_updated_at: new Date().toISOString(),
          transaction_id: 'test-transaction-123'
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating test user:', error);
        return;
      }
      
      userId = newUser.id;
      console.log('New user created with ID:', userId);
      
      // Create default instance for the user
      const { error: instanceError } = await supabase
        .from('whatsapp_instances')
        .insert([{
          user_id: userId,
          name: 'Instância Principal',
          status: 'disconnected'
        }]);
      
      if (instanceError) {
        console.error('Error creating default instance:', instanceError);
      } else {
        console.log('Default instance created for user');
      }
    }
    
    // Log webhook event
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        provider: 'hotmart',
        event_type: 'approved',
        user_id: userId,
        payload: {
          email: testEmail,
          name: testName,
          status: 'approved',
          transaction: { id: 'test-transaction-123' }
        },
        processed_at: new Date().toISOString()
      });
    
    if (logError) {
      console.error('Error logging webhook event:', logError);
    } else {
      console.log('Webhook event logged successfully');
    }
    
    console.log('Webhook test completed successfully');
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
}

testWebhook();
