import User from "../models/users";
import jwt from "jsonwebtoken";
import UserPreference from "../models/UserPreference";

const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "30d"
  });
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const user = await User.createUser(username, email, password);
    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.verifyPassword(email, password);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = generateToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const preferences = await UserPreference.findByUserId(req.user.id);
    res.json({ user, preferences });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.updateUser(req.user.id, username, email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    await User.updatePassword(req.user.id, newPassword);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    await User.deleteUser(req.user.id);
    await UserPreference.delete(req.user.id);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

