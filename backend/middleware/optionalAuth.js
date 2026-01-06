import jwt from "jsonwebtoken";

const optionalAuthMiddleware = async (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    // No token? Proceed as Guest (userId = null)
    req.body.userId = null;
    return next();
  }
  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userId = token_decode.id;
    next();
  } catch (error) {
    // Token invalid? Proceed as Guest.
    console.log("Token invalid, proceeding as guest:", error.message);
    req.body.userId = null;
    next();
  }
};

export default optionalAuthMiddleware;
