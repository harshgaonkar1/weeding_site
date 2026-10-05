import { GuestModel } from "../models/guestModel.js";

// Helper for CSV escaping
const escapeCsvField = (field) => {
  if (field === null || field === undefined) return '""';
  const stringValue = String(field).replace(/"/g, '""');
  return `"${stringValue}"`;
};

export const guestController = {
  // GET /api/guests
  async getGuests(req, res) {
    try {
      const { weddingId, side, search, rsvp, idCard, callStatus, callAttempts, sortBy, order } =
        req.query;
      const guests = await GuestModel.getAll({
        weddingId,
        side,
        search,
        rsvp,
        idCard,
        callStatus,
        callAttempts,
        sortBy,
        order,
      });
      res.status(200).json({
        success: true,
        count: guests.length,
        data: guests,
      });
    } catch (error) {
      console.error("Error fetching guests:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch guests",
        error: error.message,
      });
    }
  },

  // GET /api/guests/stats
  async getStats(req, res) {
    try {
      const { weddingId } = req.query;
      const stats = await GuestModel.getStatistics(weddingId);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching guest statistics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch statistics",
        error: error.message,
      });
    }
  },

  // GET /api/guests/:id
  async getGuestById(req, res) {
    try {
      const { id } = req.params;
      const guest = await GuestModel.getById(id);
      if (!guest) {
        return res.status(404).json({
          success: false,
          message: `Guest with ID ${id} not found`,
        });
      }
      res.status(200).json({
        success: true,
        data: guest,
      });
    } catch (error) {
      console.error("Error fetching guest by ID:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch guest details",
        error: error.message,
      });
    }
  },

  // POST /api/guests
  async createGuest(req, res) {
    try {
      const { guest_name } = req.body;
      if (!guest_name || guest_name.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Guest name is required",
        });
      }

      const newGuest = await GuestModel.create(req.body);
      res.status(201).json({
        success: true,
        message: "Guest added successfully",
        data: newGuest,
      });
    } catch (error) {
      console.error("Error creating guest:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create guest",
        error: error.message,
      });
    }
  },

  // POST /api/guests/bulk-import
  async bulkImportGuests(req, res) {
    try {
      const { wedding_id = "wedding_01", guests = [] } = req.body;
      if (!Array.isArray(guests) || guests.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No guest records provided for import",
        });
      }

      const imported = await GuestModel.bulkCreate(wedding_id, guests);
      res.status(201).json({
        success: true,
        count: imported.length,
        message: `Successfully imported ${imported.length} guests`,
        data: imported,
      });
    } catch (error) {
      console.error("Error bulk importing guests:", error);
      res.status(500).json({
        success: false,
        message: "Failed to bulk import guests",
        error: error.message,
      });
    }
  },

  // PUT /api/guests/:id
  async updateGuest(req, res) {
    try {
      const { id } = req.params;
      const updatedGuest = await GuestModel.update(id, req.body);
      if (!updatedGuest) {
        return res.status(404).json({
          success: false,
          message: `Guest with ID ${id} not found`,
        });
      }
      res.status(200).json({
        success: true,
        message: "Guest updated successfully",
        data: updatedGuest,
      });
    } catch (error) {
      console.error("Error updating guest:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update guest",
        error: error.message,
      });
    }
  },

  // DELETE /api/guests/:id
  async deleteGuest(req, res) {
    try {
      const { id } = req.params;
      const success = await GuestModel.delete(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: `Guest with ID ${id} not found`,
        });
      }
      res.status(200).json({
        success: true,
        message: "Guest deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting guest:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete guest",
        error: error.message,
      });
    }
  },

  // GET /api/guests/export/csv
  async exportCsv(req, res) {
    try {
      const { weddingId, side, callStatus, callAttempts } = req.query;
      const guests = await GuestModel.getAll({
        weddingId,
        side,
        callStatus,
        callAttempts,
        sortBy: "sr_no",
        order: "ASC",
      });

      const headers = [
        "Sr No",
        "ID",
        "Wedding ID",
        "Guest Name",
        "Contact",
        "Side (Bride/Groom)",
        "RSVP Status",
        "ID Card Received",
        "Call Checkpoint Count",
        "Call Status",
        "Last Called At",
        "Last Call Discussion Notes",
        "Arrival Date",
        "Arrival Time",
        "Arrival Location",
        "Arrival Flight/Train No",
        "Departure Date",
        "Departure Time",
        "Departure Location",
        "Departure Flight/Train No",
        "Special Request",
        "ID Card Copy",
      ];

      const rows = guests.map((g) => [
        escapeCsvField(g.sr_no),
        escapeCsvField(g.id),
        escapeCsvField(g.wedding_id),
        escapeCsvField(g.guest_name),
        escapeCsvField(g.contact),
        escapeCsvField(g.side),
        escapeCsvField(g.rsvp_status),
        escapeCsvField(g.id_card_received),
        escapeCsvField(`${g.call_count || 0} calls`),
        escapeCsvField(g.call_status || "Not Called"),
        escapeCsvField(g.last_called_at || "—"),
        escapeCsvField(g.last_call_summary || "None"),
        escapeCsvField(g.arrival_date),
        escapeCsvField(g.arrival_time),
        escapeCsvField(g.arrival_location),
        escapeCsvField(g.arrival_flight_train_no),
        escapeCsvField(g.departure_date),
        escapeCsvField(g.departure_time),
        escapeCsvField(g.departure_location),
        escapeCsvField(g.departure_flight_train_no),
        escapeCsvField(g.special_request),
        escapeCsvField(g.id_card_copy ? "Attached" : "None"),
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=guest_travel_and_call_logistics_${Date.now()}.csv`
      );
      res.status(200).send(csvContent);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export CSV",
        error: error.message,
      });
    }
  },

  // POST /api/guests/sync
  async syncGuests(req, res) {
    try {
      const { weddingId } = req.query;
      const guests = await GuestModel.getAll({ weddingId });
      res.status(200).json({
        success: true,
        message: "Guest records synchronized successfully",
        data: guests,
      });
    } catch (error) {
      console.error("Error syncing guests:", error);
      res.status(500).json({
        success: false,
        message: "Failed to sync guest data",
        error: error.message,
      });
    }
  },
};
