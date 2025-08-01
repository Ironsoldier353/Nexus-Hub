import mongoose, { Schema } from "mongoose";

const DeviceSchema = new Schema({
    macAddress: {
        type: String,
        required: true,
        unique: true
    },
    ssid: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    status: {
        type: String,
        enum: ['on', 'off', 'pending', 'active'],
        default: 'off'
    },
    isConfirmed: {
        type: Boolean,
        default: false
    },
    ipAddress: {
        type: String,
        default: null
    },
    lastConfirmed: {
        type: Date,
        default: null
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export const Device = mongoose.model('Device', DeviceSchema);