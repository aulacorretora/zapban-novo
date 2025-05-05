const supabase = require('../config/supabase');

module.exports = async (req, res, next) => {
  try {
    const userId = req.headers.userid;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - User ID not provided' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('Error fetching user for admin check:', error);
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Error in admin middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
