import axios from "axios";
import Relay from "../models/Relay.js";

const ESP32_IP = "http://192.168.0.107"; // ESP32 local IP

// Get current relay states from ESP32
export const getRelayStatus = async (req, res) => {
  try {
    const response = await axios.get(`${ESP32_IP}/status`);
    const espStates = response.data.relays;

    if (!Array.isArray(espStates)) throw new Error("Invalid relay data format");

    // Sync DB
    for (let i = 0; i < espStates.length; i++) {
      await Relay.findOneAndUpdate(
        { relayId: i },
        { state: espStates[i], updatedAt: new Date() },
        { upsert: true }
      );
    }

    const allRelays = await Relay.find();
    res.json(allRelays);
  } catch (error) {
    console.error("Error in getRelayStatus:", error.message);
    res.status(500).json({ error: "Failed to get ESP32 status" });
  }
};

// Toggle a relay
export const toggleRelay = async (req, res) => {
  const relayId = req.params.id;
  try {
    await axios.get(`${ESP32_IP}/toggle_relay_${relayId}`);

    // Get updated states
    const response = await axios.get(`${ESP32_IP}/status`);
    const espStates = response.data.relays;

    await Relay.findOneAndUpdate(
      { relayId },
      { state: espStates[relayId], updatedAt: new Date() },
      { upsert: true }
    );

    res.json({ relayId, state: espStates[relayId] });
  } catch (error) {
    console.error("Error in toggleRelay:", error.message);
    res.status(500).json({ error: "Failed to toggle relay" });
  }
};