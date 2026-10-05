import { UserModel } from "../models/userModel.js";
import { WeddingModel } from "../models/weddingModel.js";

export const authController = {
  // POST /api/auth/login
  async login(req, res) {
    try {
      const { email, username, password } = req.body;
      const identifier = email || username;

      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          message: "Username/Email and password are required",
        });
      }

      // 1. Check in System Users (Super Admin or Call Center Agent)
      const user = await UserModel.authenticate(identifier.trim(), password);
      if (user) {
        return res.status(200).json({
          success: true,
          message: `Welcome back, ${user.name}!`,
          user,
          token: `session_${user.role}_${user.id}_${Date.now()}`,
        });
      }

      // 2. Check in Marriage / Client Credentials
      const wedding = await WeddingModel.findByClientCredentials(identifier.trim(), password);
      if (wedding) {
        const clientUser = {
          id: `marriage_${wedding.id}`,
          name: `${wedding.groom_name} & ${wedding.bride_name}`,
          email: `${wedding.client_username || wedding.id}@weddingportal.com`,
          username: wedding.client_username || wedding.id,
          role: "marriage_client",
          wedding_id: wedding.id,
          venue: wedding.venue,
          city: wedding.city,
          wedding_date: wedding.wedding_date,
          cover_theme: wedding.cover_theme,
          avatar: null,
          is_view_only: true,
        };

        return res.status(200).json({
          success: true,
          message: `Welcome to ${wedding.groom_name} & ${wedding.bride_name}'s Wedding Portal!`,
          user: clientUser,
          token: `session_client_${wedding.id}_${Date.now()}`,
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid username, email, or password",
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Login failed due to server error",
        error: error.message,
      });
    }
  },

  // GET /api/auth/me
  async getMe(req, res) {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID required" });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.status(200).json({ success: true, user });
    } catch (error) {
      console.error("GetMe error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch user profile" });
    }
  },

  // GET /api/auth/users (Admin only)
  async getUsers(req, res) {
    try {
      const users = await UserModel.getAll();
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      console.error("GetUsers error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
  },

  // POST /api/auth/logout
  async logout(req, res) {
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  },
};
