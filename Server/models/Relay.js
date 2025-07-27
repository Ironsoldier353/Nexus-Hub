import mongoose from "mongoose";

const relaySchema = new mongoose.Schema({
  relayId: { type: Number, required: true, unique: true },
  state: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});

const Relay = mongoose.model("Relay", relaySchema);

export default Relay;
