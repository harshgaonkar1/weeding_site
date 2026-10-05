import { WeddingModel } from "../models/weddingModel.js";

export const weddingController = {
  // GET /api/weddings
  async getWeddings(req, res) {
    try {
      const weddings = await WeddingModel.getAll();
      res.status(200).json({
        success: true,
        count: weddings.length,
        data: weddings,
      });
    } catch (error) {
      console.error("Error fetching weddings:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch wedding events",
        error: error.message,
      });
    }
  },

  // GET /api/weddings/:id
  async getWeddingById(req, res) {
    try {
      const { id } = req.params;
      const wedding = await WeddingModel.getById(id);
      if (!wedding) {
        return res.status(404).json({
          success: false,
          message: "Wedding not found",
        });
      }
      res.status(200).json({
        success: true,
        data: wedding,
      });
    } catch (error) {
      console.error("Error fetching wedding by ID:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch wedding details",
        error: error.message,
      });
    }
  },

  // POST /api/weddings
  async createWedding(req, res) {
    try {
      const { groom_name, bride_name } = req.body;
      if (!groom_name || !bride_name) {
        return res.status(400).json({
          success: false,
          message: "Groom Name and Bride Name are required",
        });
      }

      const newWedding = await WeddingModel.create(req.body);
      res.status(201).json({
        success: true,
        message: "Wedding created successfully",
        data: newWedding,
      });
    } catch (error) {
      console.error("Error creating wedding:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create wedding",
        error: error.message,
      });
    }
  },

  // PUT /api/weddings/:id
  async updateWedding(req, res) {
    try {
      const { id } = req.params;
      const updated = await WeddingModel.update(id, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Wedding not found",
        });
      }
      res.status(200).json({
        success: true,
        message: "Wedding updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Error updating wedding:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update wedding",
        error: error.message,
      });
    }
  },

  // DELETE /api/weddings/:id
  async deleteWedding(req, res) {
    try {
      const { id } = req.params;
      const success = await WeddingModel.delete(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Wedding not found",
        });
      }
      res.status(200).json({
        success: true,
        message: "Wedding and associated guest directory deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting wedding:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete wedding",
        error: error.message,
      });
    }
  },
};
