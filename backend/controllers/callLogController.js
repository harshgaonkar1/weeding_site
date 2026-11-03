import { CallLogModel } from "../models/callLogModel.js";
import { GuestModel } from "../models/guestModel.js";
import { broadcastDataChange } from "../socket/chatSocket.js";

export const callLogController = {
  // GET /api/call-logs/guest/:guestId
  async getGuestCallLogs(req, res) {
    try {
      const { guestId } = req.params;
      const logs = await CallLogModel.getByGuestId(guestId);
      const guest = await GuestModel.getById(guestId);

      res.status(200).json({
        success: true,
        count: logs.length,
        guest,
        data: logs,
      });
    } catch (error) {
      console.error("Error fetching guest call logs:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch call logs",
        error: error.message,
      });
    }
  },

  // POST /api/call-logs
  async createCallLog(req, res) {
    try {
      const {
        guest_id,
        wedding_id,
        agent_id,
        agent_name,
        call_outcome,
        call_summary,
        callback_date,
        update_rsvp,
        special_request,
      } = req.body;

      if (!guest_id) {
        return res.status(400).json({
          success: false,
          message: "Guest ID is required",
        });
      }

      if (!call_summary || call_summary.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Call summary / discussion notes are required",
        });
      }

      const newLog = await CallLogModel.create({
        guest_id,
        wedding_id,
        agent_id,
        agent_name: agent_name || "Call Desk Agent",
        call_outcome: call_outcome || "Connected",
        call_summary: call_summary.trim(),
        callback_date,
        update_rsvp,
        special_request,
      });

      const updatedGuest = await GuestModel.getById(guest_id);

      // Broadcast WebSocket mutation events so other users/call-desks update live without polling
      const io = req.app.get("io");
      const targetWId = wedding_id || updatedGuest?.wedding_id;
      broadcastDataChange(io, {
        event: "call_logs_updated",
        weddingId: targetWId,
        payload: { action: "create", guest_id, log: newLog, guest: updatedGuest },
      });
      broadcastDataChange(io, {
        event: "guests_updated",
        weddingId: targetWId,
        payload: { action: "call_logged", guest_id, guest: updatedGuest },
      });

      res.status(201).json({
        success: true,
        message: `Call #${newLog.call_number} checkpoint recorded successfully`,
        data: newLog,
        guest: updatedGuest,
      });
    } catch (error) {
      console.error("Error recording call log:", error);
      res.status(500).json({
        success: false,
        message: "Failed to record call log",
        error: error.message,
      });
    }
  },

  // PUT /api/call-logs/:id (Update call notes / summary)
  async updateCallLog(req, res) {
    try {
      const { id } = req.params;
      const { call_outcome, call_summary, callback_date } = req.body;

      if (call_summary !== undefined && call_summary.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Call summary cannot be empty",
        });
      }

      const updated = await CallLogModel.update(id, {
        call_outcome,
        call_summary: call_summary ? call_summary.trim() : undefined,
        callback_date,
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Call log entry not found",
        });
      }

      // Broadcast WebSocket mutation events
      const io = req.app.get("io");
      broadcastDataChange(io, {
        event: "call_logs_updated",
        weddingId: updated?.wedding_id,
        payload: { action: "update", log: updated },
      });
      broadcastDataChange(io, {
        event: "guests_updated",
        weddingId: updated?.wedding_id,
        payload: { action: "call_log_updated" },
      });

      res.status(200).json({
        success: true,
        message: "Call log notes updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Error updating call log:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update call log",
        error: error.message,
      });
    }
  },

  // DELETE /api/call-logs/:id
  async deleteCallLog(req, res) {
    try {
      const { id } = req.params;
      const success = await CallLogModel.delete(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Call log entry not found",
        });
      }

      // Broadcast WebSocket mutation events
      const io = req.app.get("io");
      broadcastDataChange(io, {
        event: "call_logs_updated",
        payload: { action: "delete", id },
      });
      broadcastDataChange(io, {
        event: "guests_updated",
        payload: { action: "call_log_deleted" },
      });

      res.status(200).json({
        success: true,
        message: "Call log entry removed and checkpoint recalculated",
      });
    } catch (error) {
      console.error("Error deleting call log:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete call log",
        error: error.message,
      });
    }
  },

  // GET /api/call-logs/stats
  async getCallingStats(req, res) {
    try {
      const { weddingId } = req.query;
      const stats = await CallLogModel.getCallingStats(weddingId);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching call stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch calling statistics",
        error: error.message,
      });
    }
  },
};
