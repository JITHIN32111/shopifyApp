import Timer from '../models/Timer.js';

// Get all timers for a shop
export const getAllTimers = async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const timers = await Timer.findByShop(shop);

    res.json({ success: true, timers, count: timers.length });
  } catch (error) {
    console.error('Error fetching timers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch timers', message: error.message });
  }
};

// Get a single timer by ID
export const getTimer = async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const timerId = req.params.id;

    const timer = await Timer.findOne({ _id: timerId, shop });

    if (!timer) {
      return res.status(404).json({ success: false, error: 'Timer not found' });
    }

    res.json({ success: true, timer });
  } catch (error) {
    console.error('Error fetching timer:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch timer', message: error.message });
  }
};

// Create a new timer
export const createTimer = async (req, res) => {
  console.log(":::::::::::::::::::::::::::::::::::::::::");
  
    console.log(req.body);
    
  try {
    const shop = res.locals.shopify.session.shop;
    const timerData = { ...req.body, shop };

    const startDate = new Date(timerData.startDate);
    const endDate = new Date(timerData.endDate);

    if (startDate >= endDate) {
      return res.status(400).json({ success: false, error: 'End date must be after start date' });
    }

    if (endDate <= new Date()) {
      return res.status(400).json({ success: false, error: 'End date must be in the future' });
    }

    const timer = new Timer(timerData);
    await timer.save();

    res.status(201).json({ success: true, timer, message: 'Timer created successfully' });
  } catch (error) {
    console.error('Error creating timer:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, error: 'Validation failed', validationErrors });
    }

    res.status(500).json({ success: false, error: 'Failed to create timer', message: error.message });
  }
};

// Update a timer
export const updateTimer = async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const timerId = req.params.id;

    if (req.body.startDate && req.body.endDate) {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);

      if (startDate >= endDate) {
        return res.status(400).json({ success: false, error: 'End date must be after start date' });
      }
    }

    const timer = await Timer.findOneAndUpdate(
      { _id: timerId, shop },
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!timer) {
      return res.status(404).json({ success: false, error: 'Timer not found' });
    }

    res.json({ success: true, timer, message: 'Timer updated successfully' });
  } catch (error) {
    console.error('Error updating timer:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, error: 'Validation failed', validationErrors });
    }

    res.status(500).json({ success: false, error: 'Failed to update timer', message: error.message });
  }
};

// Delete a timer
export const deleteTimer = async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const timerId = req.params.id;

    const timer = await Timer.findOneAndDelete({ _id: timerId, shop });

    if (!timer) {
      return res.status(404).json({ success: false, error: 'Timer not found' });
    }

    res.json({ success: true, message: 'Timer deleted successfully', deletedTimer: timer });
  } catch (error) {
    console.error('Error deleting timer:', error);
    res.status(500).json({ success: false, error: 'Failed to delete timer', message: error.message });
  }
};

// Toggle timer active status
export const toggleTimerStatus = async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const timerId = req.params.id;

    const timer = await Timer.findOne({ _id: timerId, shop });

    if (!timer) {
      return res.status(404).json({ success: false, error: 'Timer not found' });
    }

    timer.isActive = !timer.isActive;
    await timer.save();

    res.json({ success: true, timer, message: `Timer ${timer.isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error('Error toggling timer status:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle timer status', message: error.message });
  }
};

// Get active timers for widget (public)
export const getActiveTimersForWidget = async (req, res) => {
  try {
    const shop = req.params.shop;

    if (!shop) {
      return res.status(400).json({ success: false, error: 'Shop parameter is required' });
    }

    const timers = await Timer.findActiveForShop(shop);

    const widgetTimers = timers.map(timer => ({
      id: timer._id,
      title: timer.title,
      description: timer.description,
      endDate: timer.endDate,
      displayOptions: timer.displayOptions,
      urgencySettings: timer.urgencySettings,
      status: timer.getStatus(),
      isInUrgencyMode: timer.isInUrgencyMode()
    }));

    res.json({ success: true, timers: widgetTimers, count: widgetTimers.length });
  } catch (error) {
    console.error('Error fetching timers for widget:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch timers', message: error.message });
  }
};

// Get timer statistics
export const getTimerStats = async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const now = new Date();

    const stats = await Timer.aggregate([
      { $match: { shop } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$isActive', true] }, { $lte: ['$startDate', now] }, { $gte: ['$endDate', now] }] },
                1, 0
              ]
            }
          },
          scheduled: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$isActive', true] }, { $gt: ['$startDate', now] }] },
                1, 0
              ]
            }
          },
          expired: {
            $sum: {
              $cond: [{ $lt: ['$endDate', now] }, 1, 0]
            }
          },
          inactive: {
            $sum: {
              $cond: [{ $eq: ['$isActive', false] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats[0] || { total: 0, active: 0, scheduled: 0, expired: 0, inactive: 0 };

    res.json({ success: true, stats: result });
  } catch (error) {
    console.error('Error fetching timer stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch timer statistics', message: error.message });
  }
};
