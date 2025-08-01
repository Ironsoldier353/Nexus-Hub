import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  admin: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }],
  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  inviteCode: { 
    type: String, 
    unique: true
  },
  inviteCodeExpiry: { 
    type: Date 
  },

  devices: [
    { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Device' 
    }
  ],
  macAddress: [{ 
    type: String, 
  }]
});

export const Room =  mongoose.model('Room', roomSchema);
