const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');

const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    const tokens = await tokenService.generateAuthTokens(user);
    res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      tokens
    });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const user = await authService.loginUser(req.body.email, req.body.password);
    const tokens = await tokenService.generateAuthTokens(user);
    res.json({
      user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      tokens
    });
  } catch (error) { next(error); }
};

const me = async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      firstName: req.user.firstName,
      lastName: req.user.lastName
    }
  });
};

module.exports = { register, login, me };