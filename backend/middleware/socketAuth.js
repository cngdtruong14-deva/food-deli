import jwt from "jsonwebtoken";

/**
 * Socket.io Authentication Middleware
 * Validates JWT token and attaches user info to socket
 * Allows Guests (no token) for public updates
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    // Get token from handshake (auth or headers)
    const token = socket.handshake.auth?.token || socket.handshake.headers?.token;
    
    // CASE 1: No Token -> Guest
    if (!token) {
      socket.userId = null;
      socket.userRole = 'guest';
      socket.userBranchId = null;
      return next();
    }
    
    // CASE 2: Token Present -> Verify
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        socket.userId = decoded.id;
        socket.userRole = decoded.role || 'customer';
        socket.userBranchId = decoded.branchId || null;
        
        next();
    } catch (err) {
        console.warn("Socket Invalid Token:", err.message);
        // Decision: Reject invalid token to prevent spoofing
        // Or demote to guest? Stick to Reject for clarity.
        return next(new Error("Invalid token"));
    }

  } catch (error) {
    console.error("Socket Middleware Check Error:", error.message);
    next(new Error("Internal Server Error"));
  }
};
