import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['ORDER', 'SYSTEM', 'PROMOTION'], 
        default: 'SYSTEM' 
    },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// TTL Index: Delete notifications after 30 days (2592000 seconds)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const notificationModel = mongoose.models.notification || mongoose.model("notification", notificationSchema);

export default notificationModel;
