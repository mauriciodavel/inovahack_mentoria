const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const JWT_SECRET = process.env.JWT_SECRET || "secreto_ultra_secreto";


function generateAccessToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });
}


function authenticateToken(req, res, next) {
  if (!req.headers.cookie) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ status: StatusCodes.UNAUTHORIZED, error: "Token de autorização ausente" });
  }

  const cookies = req.headers.cookie.split(";").map(c => c.trim());
  let token = null;
  for (const pair of cookies) {
    const [name, value] = pair.split("=");
    if (name === "authToken") {
      token = value;
      break;
    }
  }

  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ status: StatusCodes.UNAUTHORIZED, error: "Token de autorização ausente" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(StatusCodes.FORBIDDEN).json({ status: StatusCodes.FORBIDDEN, error: "Token inválido ou expirado" });
    req.user = user;
    next();
  });
}


function authorizeRole(allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(StatusCodes.UNAUTHORIZED).json({ status: StatusCodes.UNAUTHORIZED, error: "Usuário não autenticado" });
    const role = (req.user.perfil || req.user.privilege || req.user.privelage || "").toString().toLowerCase();
    const check = Array.isArray(allowed)
      ? allowed.map(r => r.toString().toLowerCase()).includes(role)
      : role === allowed.toString().toLowerCase();
    if (!check) return res.status(StatusCodes.FORBIDDEN).json({ status: StatusCodes.FORBIDDEN, error: "Acesso negado: privilégio insuficiente" });
    next();
  };
}

module.exports = {
  generateAccessToken,
  authenticateToken,
  authorizeRole,
};
