const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');

const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body.email, req.body.password, req.body.role);
    const tokens = await tokenService.generateAuthTokens(user);
    res.status(201).send({ user: { id: user.id, email: user.email, role: user.role }, tokens });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const user = await authService.loginUser(req.body.email, req.body.password);
    const tokens = await tokenService.generateAuthTokens(user);
    res.send({ user: { id: user.id, email: user.email, role: user.role }, tokens });
  } catch (error) { next(error); }
};

const me = async (req, res) => {
  res.send({ user: req.user });
};

module.exports = { register, login, me };