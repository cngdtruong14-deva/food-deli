import reviewModel from "../models/reviewModel.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";

// Helper: Mask user name for privacy (e.g., "Nguyen Van A" -> "Ng*** V*** A***")
const maskName = (name) => {
  if (!name) return "Ẩn danh";
  const parts = name.split(" ");
  return parts.map(part => {
    if (part.length <= 2) return part[0] + "*";
    return part.substring(0, 2) + "***";
  }).join(" ");
};

// Submit a review for an order
const submitReview = async (req, res) => {
  try {
    const { orderId, rating, comment, images } = req.body;
    const userId = req.body.userId;

    if (!orderId || !rating) {
      return res.json({ success: false, message: "Thiếu thông tin orderId hoặc rating" });
    }

    if (rating < 1 || rating > 5) {
      return res.json({ success: false, message: "Rating phải từ 1-5 sao" });
    }

    // Verify the order exists and belongs to this user
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    // Check if user owns this order
    if (order.userId && order.userId.toString() !== userId) {
      return res.json({ success: false, message: "Bạn không có quyền đánh giá đơn hàng này" });
    }

    // Check order status - only allow review for completed orders
    const validStatuses = ["Delivered", "Served", "Paid"];
    if (!validStatuses.includes(order.status)) {
      return res.json({ 
        success: false, 
        message: `Chỉ có thể đánh giá đơn hàng đã hoàn thành (${validStatuses.join(", ")})` 
      });
    }

    // Check if already reviewed
    const existingReview = await reviewModel.findOne({ order: orderId });
    if (existingReview) {
      return res.json({ success: false, message: "Đơn hàng này đã được đánh giá rồi" });
    }

    // Create review
    const review = new reviewModel({
      user: userId,
      order: orderId,
      branch: order.branchId || null,
      rating: Math.round(rating),
      comment: comment || "",
      images: images || [],
    });

    await review.save();

    // HIGH PRIORITY FIX: Update averageRating for all food items in the order
    try {
      // Get all food IDs from the order
      const foodIds = order.items.map(item => item._id).filter(Boolean);
      
      if (foodIds.length > 0) {
        // For each food item, recalculate average rating
        for (const foodId of foodIds) {
          // Find all orders containing this food item
          const ordersWithFood = await orderModel.find({ 
            "items._id": foodId,
            status: { $in: ["Served", "Delivered", "Paid"] }
          }).select("_id");
          
          const orderIds = ordersWithFood.map(o => o._id);
          
          if (orderIds.length > 0) {
            // Aggregate reviews for this food item
            const ratingStats = await reviewModel.aggregate([
              { $match: { order: { $in: orderIds } } },
              {
                $group: {
                  _id: null,
                  averageRating: { $avg: "$rating" },
                  totalReviews: { $sum: 1 }
                }
              }
            ]);
            
            if (ratingStats.length > 0) {
              const stat = ratingStats[0];
              // Round to 1 decimal, clamp to 0-5
              const roundedAvg = Math.max(0, Math.min(5, Math.round(stat.averageRating * 10) / 10));
              
              // Update food item
              await foodModel.findByIdAndUpdate(foodId, {
                averageRating: roundedAvg,
                totalReviews: stat.totalReviews
              });
              
              console.log(`[Review] Updated rating for food ${foodId}: ${roundedAvg} (${stat.totalReviews} reviews)`);
            }
          }
        }
      }
    } catch (error) {
      // Don't fail the review submission if rating update fails
      console.error("[Review] Error updating food ratings:", error);
    }

    res.json({ success: true, message: "Cảm ơn bạn đã đánh giá!", data: review });
  } catch (error) {
    console.error("Submit review error:", error);
    res.json({ success: false, message: "Lỗi khi gửi đánh giá: " + error.message });
  }
};

// Get public reviews for a branch (Privacy: Masked user info, no table/contact)
const getPublicReviews = async (req, res) => {
  try {
    const { branchId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    if (branchId && branchId !== "all") {
      query.branch = branchId;
    }

    const reviews = await reviewModel
      .find(query)
      .populate("user", "name") // Only fetch name
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await reviewModel.countDocuments(query);

    // Transform data for privacy
    const publicReviews = reviews.map(review => ({
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      images: review.images,
      createdAt: review.createdAt,
      reviewerName: review.user ? maskName(review.user.name) : "Ẩn danh",
      // Include admin reply if exists
      adminReply: review.adminReply?.text ? {
        text: review.adminReply.text,
        repliedAt: review.adminReply.repliedAt
      } : null,
    }));

    res.json({ 
      success: true, 
      data: publicReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get public reviews error:", error);
    res.json({ success: false, message: "Lỗi khi tải đánh giá" });
  }
};

// Get all reviews with full context (Admin only)
const getAdminReviews = async (req, res) => {
  try {
    // Verify admin status
    const userData = await userModel.findById(req.body.userId);
    if (!userData || userData.role !== "admin") {
      return res.json({ success: false, message: "Không có quyền truy cập" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const reviews = await reviewModel
      .find({})
      .populate("user", "name email phone") // Full user info
      .populate({
        path: "order",
        select: "items tableId branchId amount orderType date status",
        populate: [
          { path: "tableId", select: "tableNumber floor" },
          { path: "branchId", select: "name address" }
        ]
      })
      .populate("branch", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await reviewModel.countDocuments({});

    // Build rich context for each review
    const adminReviews = reviews.map(review => {
      const order = review.order;
      return {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        images: review.images,
        createdAt: review.createdAt,
        // User Context
        user: {
          name: review.user?.name || "Không xác định",
          email: review.user?.email || "",
          phone: review.user?.phone || "",
        },
        // Order Context (Traceability)
        orderContext: order ? {
          orderId: order._id,
          orderDate: order.date,
          orderType: order.orderType,
          status: order.status,
          amount: order.amount,
          items: order.items?.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })) || [],
          table: order.tableId ? {
            number: order.tableId.tableNumber,
            floor: order.tableId.floor
          } : null,
          branch: order.branchId ? {
            name: order.branchId.name,
            address: order.branchId.address
          } : null,
        } : null,
        // Branch shortcut
        branchName: review.branch?.name || (order?.branchId?.name) || "Không xác định",
        // Admin Reply
        adminReply: review.adminReply?.text ? {
          text: review.adminReply.text,
          repliedAt: review.adminReply.repliedAt
        } : null,
      };
    });

    res.json({ 
      success: true, 
      data: adminReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get admin reviews error:", error);
    res.json({ success: false, message: "Lỗi khi tải đánh giá: " + error.message });
  }
};

// Check if an order has been reviewed
const checkReviewStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const review = await reviewModel.findOne({ order: orderId });
    res.json({ 
      success: true, 
      hasReview: !!review,
      review: review || null
    });
  } catch (error) {
    res.json({ success: false, message: "Lỗi kiểm tra đánh giá" });
  }
};

// Admin reply to a review
const replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { replyText } = req.body;
    const adminUserId = req.body.userId;

    // Verify admin
    const userData = await userModel.findById(adminUserId);
    if (!userData || userData.role !== "admin") {
      return res.json({ success: false, message: "Không có quyền truy cập" });
    }

    if (!replyText || replyText.trim().length === 0) {
      return res.json({ success: false, message: "Vui lòng nhập nội dung phản hồi" });
    }

    const review = await reviewModel.findById(reviewId);
    if (!review) {
      return res.json({ success: false, message: "Không tìm thấy đánh giá" });
    }

    review.adminReply = {
      text: replyText.trim(),
      repliedAt: new Date(),
      repliedBy: adminUserId
    };

    await review.save();

    res.json({ success: true, message: "Phản hồi thành công!", data: review });
  } catch (error) {
    console.error("Reply to review error:", error);
    res.json({ success: false, message: "Lỗi khi gửi phản hồi: " + error.message });
  }
};

// Get reviews for a specific product (Associated via Order)
const getProductReviews = async (req, res) => {
  try {
    const { foodId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    // 1. Find all orders containing this food item
    // Note: This relies on orders keeping the original foodId in items._id
    const orders = await orderModel.find({ "items._id": foodId }).select("_id");
    const orderIds = orders.map(o => o._id);

    if (orderIds.length === 0) {
       return res.json({ 
         success: true, 
         stats: { averageRating: 0, totalReviews: 0, distribution: { 1:0, 2:0, 3:0, 4:0, 5:0 } },
         reviews: [],
         pagination: { page, limit, pages: 0, total: 0 }
       });
    }

    // 2. Aggregate Stats
    const stats = await reviewModel.aggregate([
      { $match: { order: { $in: orderIds } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          // Distribution
          star1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          star5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        }
      }
    ]);

    const statResult = stats.length > 0 ? stats[0] : { averageRating: 0, totalReviews: 0, star1:0, star2:0, star3:0, star4:0, star5:0 };

    // 3. Fetch Reviews (Paginated)
    const skip = (page - 1) * limit;
    const reviews = await reviewModel.find({ order: { $in: orderIds } })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Transform
    const transformedReviews = reviews.map(r => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      images: r.images,
      createdAt: r.createdAt,
      reviewerName: r.user ? maskName(r.user.name) : "Ẩn danh",
      adminReply: r.adminReply?.text ? {
          text: r.adminReply.text,
          repliedAt: r.adminReply.repliedAt
      } : null,
    }));

    res.json({
      success: true,
      stats: {
        averageRating: parseFloat(statResult.averageRating.toFixed(1)),
        totalReviews: statResult.totalReviews,
        distribution: {
          1: statResult.star1,
          2: statResult.star2,
          3: statResult.star3,
          4: statResult.star4,
          5: statResult.star5
        }
      },
      reviews: transformedReviews,
      pagination: {
        page,
        limit,
        total: statResult.totalReviews,
        pages: Math.ceil(statResult.totalReviews / limit)
      }
    });

  } catch (error) {
     console.error("Get product reviews error:", error);
     res.json({ success: false, message: "Lỗi khi tải đánh giá sản phẩm" });
  }
};

export { submitReview, getPublicReviews, getAdminReviews, checkReviewStatus, replyToReview, getProductReviews };
