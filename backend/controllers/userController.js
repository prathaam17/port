const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const { logActivity } = require('../utils/logger');

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Role }],
      attributes: { exclude: ['password'] }
    });
    return res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  const { username, email, password, roleId } = req.body;

  try {
    if (!username || !email || !password || !roleId) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if user already exists
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ message: 'Username is already taken.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: passwordHash,
      roleId: parseInt(roleId),
      status: 'active'
    });

    const createdUser = await User.findByPk(user.id, {
      include: [{ model: Role }],
      attributes: { exclude: ['password'] }
    });

    await logActivity(
      req,
      'USER_CREATION',
      `Created user account: ${username} with role ${createdUser.Role.name}.`
    );

    return res.status(201).json({
      message: 'User created successfully.',
      user: createdUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Update user details (Role and Status)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { roleId, status } = req.body;

  try {
    const user = await User.findByPk(id, { include: [{ model: Role }] });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (roleId) {
      user.roleId = parseInt(roleId);
    }

    if (status) {
      user.status = status;
    }

    await user.save();

    const updatedUser = await User.findByPk(user.id, {
      include: [{ model: Role }],
      attributes: { exclude: ['password'] }
    });

    await logActivity(
      req,
      'USER_MODIFICATION',
      `Updated user ${user.username}. Role: ${updatedUser.Role.name}, Status: ${updatedUser.status}.`
    );

    return res.json({
      message: 'User updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Delete user account
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.username === 'admin') {
      return res.status(400).json({ message: 'Default Super Admin account cannot be deleted.' });
    }

    await user.destroy();

    await logActivity(
      req,
      'USER_DELETION',
      `Deleted user account: ${user.username}.`
    );

    return res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Get list of all roles
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    return res.json(roles);
  } catch (error) {
    console.error('Get roles error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};
