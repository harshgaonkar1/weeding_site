import { UserModel } from "../models/userModel.js";
import { WeddingModel } from "../models/weddingModel.js";
import { broadcastDataChange } from "../socket/chatSocket.js";

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
          wedding,
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
      res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
      console.error("GetUsers error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
  },

  // POST /api/auth/users (Admin only - create new Call Center user or Admin)
  async createUser(req, res) {
    try {
      const { name, email, username, password, role, phone, wedding_id, assigned_weddings } = req.body;
      const userIdentifier = email || username;

      if (!name || !userIdentifier || !password) {
        return res.status(400).json({
          success: false,
          message: "Name, email/username, and password are required",
        });
      }

      // Check if user already exists
      const existing = await UserModel.findByIdentifier(userIdentifier);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `A user with email or username "${userIdentifier}" already exists`,
        });
      }

      const created = await UserModel.create({
        name: name.trim(),
        email: userIdentifier.trim(),
        password: password.trim(),
        role: role || "call_center",
        phone: phone ? String(phone).trim() : null,
        wedding_id: wedding_id || "all",
        assigned_weddings: Array.isArray(assigned_weddings) ? assigned_weddings : [wedding_id || "all"],
      });

      broadcastDataChange({
        type: "user_created",
        action: "user_created",
        userId: created.id,
        wedding_id: created.wedding_id,
        user: created,
      });

      res.status(201).json({
        success: true,
        message: `Call center user "${created.name}" created successfully`,
        data: created,
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create user account",
        error: error.message,
      });
    }
  },

  // PUT /api/auth/users/:id (Admin only - update user or assignment)
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, username, password, role, phone, wedding_id, assigned_weddings } = req.body;

      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const updated = await UserModel.update(id, {
        name,
        email: email || username,
        password,
        role,
        phone,
        wedding_id,
        assigned_weddings,
      });

      broadcastDataChange({
        type: "user_updated",
        action: "user_updated",
        userId: id,
        wedding_id: updated.wedding_id,
        user: updated,
      });

      res.status(200).json({
        success: true,
        message: `User "${updated.name}" updated successfully`,
        data: updated,
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update user account",
        error: error.message,
      });
    }
  },

  // DELETE /api/auth/users/:id (Admin only)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await UserModel.delete(id);
      broadcastDataChange({
        type: "user_deleted",
        action: "user_deleted",
        userId: id,
      });

      res.status(200).json({
        success: true,
        message: "User account deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete user account",
      });
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
