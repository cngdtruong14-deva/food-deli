import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// TTL Index: Delete tokens after 15 minutes (900 seconds)
tokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

const tokenModel = mongoose.models.token || mongoose.model("token", tokenSchema);

export default tokenModel;
