const supabase = require('../config/supabase');

module.exports = async (req, res, next) => {
  try {
    const userId = req.headers.userid;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - User ID not provided' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, active')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('Error fetching user for auth check:', error);
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Forbidden - User account is inactive' });
    }

    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
