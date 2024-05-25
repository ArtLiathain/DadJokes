import jwt from "jsonwebtoken";
import "dotenv/config";

export const generateAccessToken = (userDetails) => {
  const payload = {
    publicKey: userDetails.publicKey,
    email: userDetails.email,
  };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: "1h" };

  return jwt.sign(payload, secret, options);
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  const result = verifyAccessToken(token);

  if (!result.success) {
    return res.status(403).json({ error: result.error });
  }

  req.user = result.data;
  next();
};

const verifyAccessToken = (token) => {
  const secret = process.env.JWT_SECRET;

  try {
    const decoded = jwt.verify(token, secret);
    return { success: true, data: decoded };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const extractJwtClaims = (authHeader, fieldToGet) => {
  const token = authHeader && authHeader.split(" ")[1];
  try {
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded) {
      throw new Error("Invalid token");
    }
    return decoded.payload
  } catch (error) {
    return null;
  }
};
