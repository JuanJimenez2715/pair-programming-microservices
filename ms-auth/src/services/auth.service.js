const bcrypt = require('bcrypt');
const User = require('../models/user.model');

const registerUser = async (email, password, role) => {
  if (await User.findOne({ where: { email } })) throw new Error('Email already taken');
  const hashedPassword = await bcrypt.hash(password, 10);
  return await User.create({ email, password: hashedPassword, role });
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) throw new Error('Incorrect email or password');
  return user;
};

module.exports = { registerUser, loginUser };