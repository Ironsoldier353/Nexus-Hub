import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  username: {
    type: String,
    unique: true,
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  securityQuestion: {
    type: String,
    
  },
  securityAnswer: {
    type: String,
    
  }
});

export const User = mongoose.model('User', userSchema);
