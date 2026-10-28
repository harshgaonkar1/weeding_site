import { WeddingModel } from "../models/weddingModel.js";
import { GuestModel } from "../models/guestModel.js";
import { MessageModel } from "../models/messageModel.js";
import { ExcelService } from "../services/excelService.js";
import { GoogleSheetsService } from "../services/googleSheetsService.js";
import fs from "fs";
import { supabase } from '../Db_connection/supabaseClient.js';
import { store } from '../Db_connection/queries.js';

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
      if (!id) {
        return res.status(400).json({ success: false, message: 'Wedding ID is required' });
      }

      // 1. Fetch wedding info if in memory or Supabase for Google Sheet cleanup
      let wedding = null;
      if (store && Array.isArray(store.weddings)) {
        wedding = store.weddings.find((w) => w.id === id) || null;
      }
      if (!wedding && supabase) {
        try {
          const { data } = await supabase
            .from('weddings')
            .select('id, groom_name, bride_name, google_sheet_id, google_sheet_url')
            .eq('id', id)
            .single();
          wedding = data;
        } catch (e) {}
      }

      // 2. Execute DB & local deletion (fast, resilient, non-blocking)
      await WeddingModel.delete(id);

      // 3. Fire-and-forget Google Sheet cleanup (never blocks HTTP response)
      if (wedding && (wedding.google_sheet_url || wedding.google_sheet_id)) {
        setImmediate(() => {
          Promise.race([
            GoogleSheetsService.deleteWeddingSheet(wedding),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Sheet timeout')), 4000)),
          ]).catch(() => {});
        });
      }

      // 4. Return success immediately
      return res.status(200).json({
        success: true,
        message: 'Wedding and associated guest directory deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting wedding:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete wedding',
        error: error.message,
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
