import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  admin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  devices: [
    { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Device' 
    }
  ],
  macAddress: [{ 
    type: String, 
  }],
  recipes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe'
    }
  ]
});

export const Room = mongoose.model('Room', roomSchema);