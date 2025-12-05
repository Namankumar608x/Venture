import jwt from "jsonwebtoken";
const ACCESS_SECRET = process.env.ACCESS_SECRET || "ava";

export default function (req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No auth header" });

  const token = auth.split(" ")[1];
  jwt.verify(token, ACCESS_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.user = payload;
    next();
  });
}
