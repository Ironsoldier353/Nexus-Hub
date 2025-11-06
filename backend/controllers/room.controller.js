import { User } from '../models/user.model.js';
import { Room } from '../models/room.model.js';

export const getRoomDetails = async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findById(roomId)
      .populate('admin', 'email')
      .exec();

    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Check if the requesting user is the admin of this room
    if (String(room.admin._id) !== String(req.user._id)) {
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
