const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

const registerUser = async ({ email, password, role, firstName, lastName }) => {
  if (await User.findOne({ where: { email } })) {
    const error = new Error('El correo ya está registrado.');
    error.statusCode = 409;
    throw error;
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  return await User.create({ email, password: hashedPassword, role, firstName, lastName });
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const error = new Error('Correo o contraseña incorrectos.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Correo o contraseña incorrectos.');
    error.statusCode = 401;
    throw error;
  }

  return user;
};

module.exports = { registerUser, loginUser };