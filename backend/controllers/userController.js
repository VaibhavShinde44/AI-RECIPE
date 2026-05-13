import User from "../models/users";
import UserPreference from "../models/UserPreference";

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

export const updatePreferences = async (req, res) => {
  try {
    const preferences = await UserPreference.upsert(req.user.id, req.body);
    res.json({ preferences });
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
