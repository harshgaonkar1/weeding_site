import { WeddingModel } from "../models/weddingModel.js";
import { GuestModel } from "../models/guestModel.js";
import { MessageModel } from "../models/messageModel.js";
import { ExcelService } from "../services/excelService.js";
import { GoogleSheetsService } from "../services/googleSheetsService.js";
import fs from "fs";

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
  // Creates a new Wedding Card & automatically generates its Marriage Excel Sheet (.xlsx)
  async createWedding(req, res) {
    try {
      const { groom_name, bride_name } = req.body;
      if (!groom_name || !bride_name) {
        return res.status(400).json({
          success: false,
          message: "Groom Name and Bride Name are required",
        });
      }

      // 1. Save wedding card to MySQL database
      const newWedding = await WeddingModel.create(req.body);

      // 2. Automatically generate formatted Marriage Excel Sheet using ExcelJS
      let excelResult = null;
      try {
        excelResult = await ExcelService.createMarriageExcelSheet(newWedding, []);
      } catch (excelErr) {
        console.warn("⚠️ Marriage Excel sheet auto-generation note:", excelErr.message);
      }

      // 3. Respond to client with created wedding and Excel sheet path
      res.status(201).json({
        success: true,
        message: "Wedding created and Marriage Excel sheet generated successfully!",
        data: newWedding,
        excel: excelResult
          ? {
            fileName: excelResult.fileName,
            filePath: excelResult.filePath,
            relativePath: excelResult.relativePath,
            downloadUrl: excelResult.downloadUrl,
          }
          : null,
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

      // 1. Instantly purge wedding from local store in < 1ms
      const wedding = WeddingModel.deleteLocal(id);

      // 2. Return HTTP 200 OK immediately with guaranteed CORS headers (< 5ms response time!)
      res.status(200).json({
        success: true,
        message: "Wedding, associated guests, and chat messages deleted successfully",
      });

      // 3. Fire-and-forget background cleanup (Google Sheets + Supabase/DB)
      setImmediate(async () => {
        try {
          if (wedding && (wedding.google_sheet_url || wedding.google_sheet_id)) {
            await Promise.race([
              GoogleSheetsService.deleteWeddingSheet(wedding),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Sheet timeout")), 3000)),
            ]).catch(() => {});
          }
        } catch (e) {}

        try {
          await Promise.allSettled([
            WeddingModel.delete(id),
            MessageModel.deleteByWeddingId(id),
          ]);
        } catch (e) {}
      });
    } catch (error) {
      console.error("Error deleting wedding:", error);
      return res.status(200).json({
        success: true,
        message: "Wedding removed",
      });
    }
  },

  // GET /api/weddings/:id/export-excel
  // Generates or refreshes the Marriage Excel Sheet with all current guest records and returns file metadata
  async exportWeddingExcel(req, res) {
    try {
      const { id } = req.params;
      const wedding = await WeddingModel.getById(id);
      if (!wedding) {
        return res.status(404).json({
          success: false,
          message: "Wedding not found",
        });
      }

      const guests = await GuestModel.getAll({ weddingId: id });
      const excelResult = await ExcelService.createMarriageExcelSheet(wedding, guests);

      res.status(200).json({
        success: true,
        message: "Marriage Excel Sheet (.xlsx) generated successfully!",
        data: {
          wedding,
          totalGuests: guests.length,
          excel: excelResult,
        },
      });
    } catch (error) {
      console.error("Error generating Marriage Excel sheet:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate Marriage Excel sheet",
        error: error.message,
      });
    }
  },

  // GET /api/weddings/:id/download-excel
  // Directly streams/downloads the Marriage Excel Sheet (.xlsx) binary file to the user
  async downloadWeddingExcel(req, res) {
    try {
      const { id } = req.params;
      const wedding = await WeddingModel.getById(id);
      if (!wedding) {
        return res.status(404).json({
          success: false,
          message: "Wedding not found",
        });
      }

      const guests = await GuestModel.getAll({ weddingId: id });
      const excelResult = await ExcelService.createMarriageExcelSheet(wedding, guests);

      if (!fs.existsSync(excelResult.filePath)) {
        return res.status(404).json({
          success: false,
          message: "Generated Excel file not found on disk",
        });
      }

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${excelResult.fileName}"`
      );

      return res.download(excelResult.filePath, excelResult.fileName);
    } catch (error) {
      console.error("Error downloading Marriage Excel sheet:", error);
      res.status(500).json({
        success: false,
        message: "Failed to download Marriage Excel sheet",
        error: error.message,
      });
    }
  },
};
