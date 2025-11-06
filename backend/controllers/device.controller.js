import { Device } from "../models/devices.model.js";
import { Room } from "../models/room.model.js";


export const registerDevice = async (req, res) => {
    const { newDevice } = req.body;
    if (!newDevice) {
        return res.status(400).json({ message: "newDevice object is required.", success: false });
    }

    const { deviceName, macAddress, ssid, password } = newDevice;

    const roomId = req.roomId;
    console.log("req: ", req.user);
    console.log("Room ID: ", roomId);

    // Validate required fields
    if (!deviceName || !macAddress || !ssid || !password) {
        return res.status(400).json({ message: "All fields (name, macAddress, ssid, password) are required.", success: false });
    }

    if (!roomId) {
        return res.status(400).json({ message: "Room ID is required.", success: false });
    }

    try {
        // Check if the room exists
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Room not found.", success: false });
        }

        // Check if the device already exists
        const existingDevice = await Device.findOne({ macAddress });
        if (existingDevice) {
            return res.status(409).json({ message: "Device already exists. Please Give another proper MAC Address...", success: false });
        }

        // Create a new device - renamed variable to avoid shadowing
        const createdDevice = await Device.create({
            name: deviceName,
            macAddress,
            ssid,
            password,
            room: roomId,
            status: "pending",
        });

        // Define appliances to create

        await createdDevice.save();

        //room.devices.push(createdDevice._id);

        return res.status(201).json({
            success: true,
            message: 'Device registered successfully',
            device: {
                _id: createdDevice._id,
                name: createdDevice.name,
                macAddress: createdDevice.macAddress,
                status: createdDevice.status
            }
        });
    } catch (err) {
        console.error("Error while registering Your device:", err);
        res.status(500).json({
            message: "Error while registering Your device. ",
            error: err.message,
            success: false,
        });
    }
};

export const validateDevices = async (req, res) => {
    const { macAddress, ipAddress } = req.body;

    if (!macAddress || !ipAddress) {
        return res.status(400).json({ message: "MAC address and IP address are required.", success: false });
    }

    try {
        const device = await Device.findOne({ macAddress });
        if (!device) {
            return res.status(400).json({
                message: "MAC address mismatch. Device not found.",
                success: false,
            });
        }

        // If device is already active and IP has changed → update IP
        if (device.status === "active" && device.ipAddress && device.ipAddress !== ipAddress) {
            device.ipAddress = ipAddress;
            await device.save();
        }

        // If first time validation → set status = active
        if (device.status === "pending") {
            device.status = "active";
            device.ipAddress = ipAddress;
            device.isConfirmed = true;

            await device.save();
        }

        const responseObj = {
            ssid: device.ssid,
            password: device.password,
            deviceId: device._id.toString(),
            success: true,
            message: "Device validated successfully.",
        };

        return res.status(200).json(responseObj);

    } catch (err) {
        console.error("Error validating device:", err);
        res.status(500).json({ message: "Internal server error.", success: false });
    }
};

export const getAllDevices = async (req, res) => {
    try {
        const { roomId } = req.params; // Get roomId from URL parameters

        const devices = await Device.find({ room: roomId }) // Filter by room
            .populate('room')
            .select('-password'); // Don't send WiFi passwords

        console.log("Devices fetched:", devices);

        return res.status(200).json({
            success: true,
            devices: devices || []
        });
    } catch (error) {
        console.error('Error fetching devices:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Controller to get a single device
export const getDeviceById = async (req, res) => {
    try {
        const { deviceId } = req.params;

        const device = await Device.findById(deviceId)
            .populate('room')
            .select('-password -ipAddress'); // Don't send WiFi password

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        return res.status(200).json(device);
    } catch (error) {
        console.error('Error fetching device:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to update device information
export const updateDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { name, macAddress, ssid, password } = req.body;

        const device = await Device.findById(deviceId);

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        let updated = false;

        // Update fields only if value is provided and different
        if (name && name !== device.name) {
            device.name = name;
            updated = true;
        }

        if (macAddress && macAddress !== device.macAddress) {
            device.macAddress = macAddress;
            updated = true;
        }

        if (ssid && ssid !== device.ssid) {
            device.ssid = ssid;
            updated = true;
        }

        if (password && password !== device.password) {
            device.password = password;
            updated = true;
        }

        if (updated) {
            device.lastUpdated = new Date();
            await device.save();

            return res.status(200).json({
                success: true,
                message: 'Device updated successfully',
                device: {
                    _id: device._id,
                    name: device.name,
                    macAddress: device.macAddress,
                    status: device.status
                }
            });
        } else {
            return res.status(200).json({
                success: false,
                message: 'No changes detected. Device not updated.',
                device: {
                    _id: device._id,
                    name: device.name,
                    macAddress: device.macAddress,
                    status: device.status
                }
            });
        }
    } catch (error) {
        console.error('Error updating device:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


export const getDeviceIpAddress = async (req, res) => {
    try {
        const { deviceId } = req.params;

        if (!deviceId) {
            return res.status(400).json({ error: 'Device ID is required' });
        }

        // Fetch only the ipAddress field
        const device = await Device.findById(deviceId).select('ipAddress');

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        return res.status(200).json({ ipAddress: device.ipAddress });
    } catch (error) {
        console.error('Error fetching device IP address:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};








