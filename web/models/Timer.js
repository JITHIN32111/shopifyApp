import mongoose from 'mongoose';

const timerSchema = new mongoose.Schema({
  shop: { 
    type: String, 
    required: true, 
    index: true,
    trim: true
  },
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 500
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true, // handles createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
timerSchema.index({ shop: 1, createdAt: -1 });
timerSchema.index({ shop: 1, isActive: 1, startDate: 1, endDate: 1 });

// Virtuals (optional but useful)
timerSchema.virtual('status').get(function () {
  const now = new Date();
  if (!this.isActive) return 'inactive';
  if (now < this.startDate) return 'scheduled';
  if (now > this.endDate) return 'expired';
  return 'active';
});

// Static methods
timerSchema.statics.findActiveForShop = function(shop) {
  const now = new Date();
  return this.find({
    shop,
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).sort({ createdAt: -1 });
};

timerSchema.statics.findByShop = function(shop) {
  return this.find({ shop }).sort({ createdAt: -1 });
};

const Timer = mongoose.model('Timer', timerSchema);
export default Timer;





// import mongoose from 'mongoose';

// const timerSchema = new mongoose.Schema({
//   shop: { 
//     type: String, 
//     required: true, 
//     index: true,
//     trim: true
//   },
//   title: { 
//     type: String, 
//     required: true,
//     trim: true,
//     maxlength: 100
//   },
//   description: { 
//     type: String, 
//     required: true,
//     trim: true,
//     maxlength: 500
//   },
//   startDate: { 
//     type: Date, 
//     required: true 
//   },
//   endDate: { 
//     type: Date, 
//     required: true 
//   },
//   isActive: { 
//     type: Boolean, 
//     default: true 
//   },
//   displayOptions: {
//     color: { 
//       type: String, 
//       default: '#ff6b6b',
//       validate: {
//         validator: function(v) {
//           return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
//         },
//         message: 'Color must be a valid hex color'
//       }
//     },
//     backgroundColor: { 
//       type: String, 
//       default: '#ffffff',
//       validate: {
//         validator: function(v) {
//           return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
//         },
//         message: 'Background color must be a valid hex color'
//       }
//     },
//     textColor: { 
//       type: String, 
//       default: '#333333',
//       validate: {
//         validator: function(v) {
//           return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
//         },
//         message: 'Text color must be a valid hex color'
//       }
//     },
//     size: { 
//       type: String, 
//       enum: ['small', 'medium', 'large'], 
//       default: 'medium' 
//     },
//     position: { 
//       type: String, 
//       enum: ['top', 'above-cart', 'below-title', 'bottom'], 
//       default: 'top' 
//     }
//   },
//   urgencySettings: {
//     enabled: { 
//       type: Boolean, 
//       default: true 
//     },
//     threshold: { 
//       type: Number, 
//       default: 5,
//       min: 1,
//       max: 60
//     },
//     pulseColor: { 
//       type: String, 
//       default: '#ff0000',
//       validate: {
//         validator: function(v) {
//           return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
//         },
//         message: 'Pulse color must be a valid hex color'
//       }
//     },
//     showBanner: { 
//       type: Boolean, 
//       default: true 
//     }
//   },
//   createdAt: { 
//     type: Date, 
//     default: Date.now 
//   },
//   updatedAt: { 
//     type: Date, 
//     default: Date.now 
//   }
// }, {
//   timestamps: true // This will automatically handle createdAt and updatedAt
// });

// // Index for better query performance
// timerSchema.index({ shop: 1, createdAt: -1 });
// timerSchema.index({ shop: 1, isActive: 1, startDate: 1, endDate: 1 });

// // Pre-save middleware to update the updatedAt field
// timerSchema.pre('save', function(next) {
//   this.updatedAt = new Date();
//   next();
// });

// // Pre-update middleware
// timerSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
//   this.set({ updatedAt: new Date() });
//   next();
// });

// // Virtual for checking if timer is currently running
// timerSchema.virtual('isRunning').get(function() {
//   const now = new Date();
//   return this.isActive && 
//          this.startDate <= now && 
//          this.endDate >= now;
// });

// // Virtual for checking if timer is scheduled
// timerSchema.virtual('isScheduled').get(function() {
//   const now = new Date();
//   return this.isActive && this.startDate > now;
// });

// // Virtual for checking if timer is expired
// timerSchema.virtual('isExpired').get(function() {
//   const now = new Date();
//   return this.endDate < now;
// });

// // Instance method to get timer status
// timerSchema.methods.getStatus = function() {
//   const now = new Date();
  
//   if (!this.isActive) {
//     return 'inactive';
//   } else if (now < this.startDate) {
//     return 'scheduled';
//   } else if (now > this.endDate) {
//     return 'expired';
//   } else {
//     return 'active';
//   }
// };

// // Instance method to check if timer is in urgency mode
// timerSchema.methods.isInUrgencyMode = function() {
//   if (!this.urgencySettings.enabled || !this.isRunning) {
//     return false;
//   }
  
//   const now = new Date();
//   const timeLeft = this.endDate - now;
//   const urgencyThreshold = this.urgencySettings.threshold * 60 * 1000; // Convert minutes to milliseconds
  
//   return timeLeft <= urgencyThreshold && timeLeft > 0;
// };

// // Static method to find active timers for a shop
// timerSchema.statics.findActiveForShop = function(shop) {
//   const now = new Date();
//   return this.find({
//     shop: shop,
//     isActive: true,
//     startDate: { $lte: now },
//     endDate: { $gte: now }
//   }).sort({ createdAt: -1 });
// };

// // Static method to find all timers for a shop
// timerSchema.statics.findByShop = function(shop) {
//   return this.find({ shop: shop }).sort({ createdAt: -1 });
// };

// // Ensure virtual fields are serialized
// timerSchema.set('toJSON', { 
//   virtuals: true,
//   transform: function(doc, ret) {
//     delete ret.__v;
//     return ret;
//   }
// });

// const Timer = mongoose.model('Timer', timerSchema);

// export default Timer;