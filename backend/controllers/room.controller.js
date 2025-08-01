import { User } from '../models/user.model.js';
import { Room } from '../models/room.model.js';
import { generateInviteCode } from '../utils/generateInviteCode.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/generateToken.js';
import mongoose from 'mongoose';


export const generateInviteCodeForRoom = async (req, res) => {
  const { roomId } = req.params;
  const room = await Room.findById(roomId);

  if (!room) return res.status(404).json({ message: 'Room not found', success: false });

  const isAdmin = room.admin.some(admin => String(admin._id) === String(req.user._id));
  if (!isAdmin) {
    return res.status(403).json({ message: 'Only Admin can access', success: false });
  }

  try {
    const expiryTime = new Date(Date.now() + 1 * 60 * 1000);
    expiryTime.setMinutes(expiryTime.getMinutes() + 330);
    const inviteCode = generateInviteCode();
    room.inviteCode = inviteCode;
    room.inviteCodeExpiry = expiryTime;

    await room.save();
    res.json({ inviteCode, message: 'Invite code generated successfully', success: true });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Failed to generate unique invite code. Please try again.',
        success: false,

      });
    }

    res.status(500).json({ message: 'Internal server error', success: false });
  }
};

export const addMemberToRoom = async (req, res) => {
  const { email, password, inviteCode } = req.body;
 
  const existingUser = await User.findOne({email});
  if (existingUser) {
    return res.status(400).json({ message: 'Email already exists', success: false });
  }

  const room = await Room.findOne({ inviteCode });
 
  if (!room) return res.status(400).json({ message: 'Invalid invite code', success: false });

  const currentTime = new Date();
  currentTime.setMinutes(currentTime.getMinutes() + 330);

  if (!room.inviteCodeExpiry || room.inviteCodeExpiry < currentTime) {
    return res.status(400).json({
      message: 'Invite code has expired. Collect a new invite code from admin',
      success: false,
    });
  }

  try {
    
    const username = email.split('@')[0];
    const hashedPassword = await bcrypt.hash(password, 10);
    

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: 'member',
      room: room._id,
      username,
    });
    

    room.members.push(newUser._id);
    await room.save();

    res.status(201).json({
      user: newUser,
      message: `Member added to Room-${room._id} successfully`,
      success: true,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Email already exists',
        success: false,
      });
    }

    res.status(500).json({ message: 'Internal server error', success: false });

  }
};

export const removeMemberFromRoom = async (req, res) => {
  const { memberId } = req.body;
  const { roomId } = req.params;

  try {

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found', success: false });
    }

    if (String(room.admin) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only Admin can access', success: false });
    }

    const memberIdObjectId = new mongoose.Types.ObjectId(memberId);

    const memberIndex = room.members.findIndex(member => {
      return new mongoose.Types.ObjectId(member).equals(memberIdObjectId);
    });

    if (memberIndex === -1) {
      return res.status(400).json({ message: 'Member not found in the room', success: false });
    }

    room.members.splice(memberIndex, 1);
    await room.save();


    await User.findByIdAndDelete(memberIdObjectId);

    res.json({ message: 'Member removed successfully', success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Internal server error', success: false });
  }
};

export const getRoomDetails = async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findById(roomId)
      .populate('members', 'email')
      .populate('admin', 'email')
      .exec();

    if (!room) return res.status(404).json({ message: 'Room not found' });


    const isAdmin = room.admin.some(admin => String(admin._id) === String(req.user._id));
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only Admin can access' });
    }

    res.json({ room, message: 'Room details fetched successfully', success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getRoomIDbyUsername = async (req, res) => {
  const { username } = req.body;

  if (!username) return res.status(400).json({ message: 'Username is required', success: false });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found', success: false });

    const room = await Room.findById(user.room._id);
    if (!room) return res.status(404).json({ message: 'Room not found', success: false });

    return res.json({ roomId: room._id, success: true, message: 'Room ID fetched successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error', success: false });
  }
};

export const registerAsAdmin = async (req, res) => {
  const { email, password, roomId } = req.body;


  if (!email || !password || !roomId) {
    return res.status(400).json({ message: 'All fields are required', success: false });
  }

  // Check if room exists
  const room = await Room.findById(roomId);
  if (!room) {
    return res.status(404).json({ message: 'Room not found', success: false });
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already exists', success: false });
  }

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10);
  const username = `user_${Math.random().toString(36).substr(2, 6)}`;

  // Create a new admin user
  const newUser = await User.create({
    email,
    password: hashedPassword,
    username,
    role: 'admin',
  });

  // Update room with invite code and expiry
  room.inviteCode = generateInviteCode();
  room.inviteCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for invite expiry
  room.admin.push(newUser._id);
  await room.save();

  // Assign the room to the user and save
  newUser.room = room._id;
  await newUser.save();

  // Return response with the created user and token
  res.status(201).json({
    user: newUser,
    token: generateToken(newUser._id),
    message: 'Admin registered using roomid successfully',
    success: true,
  });

};
