import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the export directory exists
export const getExportDir = () => {
  const exportDir = path.resolve(__dirname, "../exports");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  return exportDir;
};

/**
 * Service to generate styled Excel Spreadsheets (.xlsx) for Weddings / Marriage Cards
 */
export const ExcelService = {
  /**
   * Generates a dedicated, formatted Marriage Excel Workbook (.xlsx)
   * @param {Object} wedding - Wedding entity object
   * @param {Array} guests - List of guest objects for this wedding (optional)
   * @returns {Promise<{fileName: string, filePath: string, relativePath: string, downloadUrl: string}>}
   */
  async createMarriageExcelSheet(wedding, guests = []) {
    if (!wedding || !wedding.id) {
      throw new Error("Invalid wedding data: Wedding ID is required to generate marriage sheet.");
    }

    const exportDir = getExportDir();

    // 1. Create a new Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Emitly Multi-Wedding Logistics System";
    workbook.lastModifiedBy = "Wedding Management Desk";
    workbook.created = new Date();
    workbook.modified = new Date();

    // -------------------------------------------------------------
    // SHEET 1: Marriage Card Overview & Access Credentials
    // -------------------------------------------------------------
    const overviewSheet = workbook.addWorksheet("Marriage Details", {
      views: [{ showGridLines: true }],
      pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    overviewSheet.columns = [
      { header: "Attribute", key: "attribute", width: 28 },
      { header: "Details / Information", key: "value", width: 55 },
    ];

    // Format Overview Header Row
    const overviewHeaderRow = overviewSheet.getRow(1);
    overviewHeaderRow.height = 32;
    overviewHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F2922" }, // Deep Emerald
      };
      cell.font = {
        name: "Calibri",
        size: 13,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "medium", color: { argb: "FF84E030" } },
        bottom: { style: "medium", color: { argb: "FF84E030" } },
      };
    });

    // Overview Rows Data
    const coupleName = `${wedding.groom_name || "Groom"} & ${wedding.bride_name || "Bride"}`;
    const overviewData = [
      { attribute: "Marriage Card ID", value: wedding.id },
      { attribute: "Couple", value: coupleName },
      { attribute: "Groom's Name", value: wedding.groom_name || "N/A" },
      { attribute: "Bride's Name", value: wedding.bride_name || "N/A" },
      { attribute: "Wedding Date", value: wedding.wedding_date || "Date TBD" },
      { attribute: "Venue", value: wedding.venue || "Venue TBD" },
      { attribute: "City / Location", value: wedding.city || "City TBD" },
      { attribute: "Card Theme", value: wedding.cover_theme || "emerald" },
      { attribute: "Client Portal User ID", value: wedding.client_username || `${wedding.groom_name}_${wedding.bride_name}`.toLowerCase() },
      { attribute: "Client Portal Password", value: wedding.client_password || "Configured" },
      { attribute: "Google Sheet Link", value: wedding.google_sheet_url || "Not linked yet" },
      { attribute: "Registered Guests", value: `${guests.length || wedding.total_guests || 0} Guest(s)` },
      { attribute: "Event Notes & Remarks", value: wedding.notes || "Grand Wedding Celebration & Logistics Management" },
      { attribute: "Sheet Generated At", value: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) },
    ];

    overviewData.forEach((rowObj, index) => {
      const addedRow = overviewSheet.addRow(rowObj);
      addedRow.height = 24;

      const isEven = index % 2 === 0;
      addedRow.getCell("attribute").font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF1E293B" } };
      addedRow.getCell("attribute").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isEven ? "FFF1F5F9" : "FFF8FAFC" },
      };
      addedRow.getCell("attribute").alignment = { vertical: "middle", horizontal: "left", indent: 1 };

      addedRow.getCell("value").font = { name: "Calibri", size: 11, color: { argb: "FF0F172A" } };
      addedRow.getCell("value").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isEven ? "FFFFFFFF" : "FFFDFDFD" },
      };
      addedRow.getCell("value").alignment = { vertical: "middle", horizontal: "left", wrapText: true, indent: 1 };

      addedRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    });

    // -------------------------------------------------------------
    // SHEET 2: Guest Directory & Logistics Checkpoints
    // -------------------------------------------------------------
    const guestSheet = workbook.addWorksheet("Guest Directory", {
      views: [{ state: "frozen", xSplit: 2, ySplit: 1, showGridLines: true }],
    });

    guestSheet.columns = [
      { header: "Sr No", key: "sr_no", width: 10 },
      { header: "Guest Name", key: "guest_name", width: 26 },
      { header: "Contact Number", key: "contact", width: 18 },
      { header: "Side", key: "side", width: 14 },
      { header: "Relation", key: "relation", width: 20 },
      { header: "RSVP Status", key: "rsvp_status", width: 16 },
      { header: "ID Card Received", key: "id_card_received", width: 18 },
      { header: "Arrival Date", key: "arrival_date", width: 15 },
      { header: "Arrival Time", key: "arrival_time", width: 14 },
      { header: "Arrival Location", key: "arrival_location", width: 26 },
      { header: "Arrival Flight / Train", key: "arrival_flight_train_no", width: 22 },
      { header: "Departure Date", key: "departure_date", width: 15 },
      { header: "Departure Time", key: "departure_time", width: 14 },
      { header: "Departure Location", key: "departure_location", width: 26 },
      { header: "Departure Flight / Train", key: "departure_flight_train_no", width: 22 },
      { header: "Special Requests / Diet", key: "special_request", width: 30 },
      { header: "Call Status", key: "call_status", width: 18 },
      { header: "Call Count", key: "call_count", width: 12 },
      { header: "Last Call Notes", key: "last_call_summary", width: 35 },
    ];

    // Format Guest Header Row
    const guestHeaderRow = guestSheet.getRow(1);
    guestHeaderRow.height = 30;
    guestHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF164E3D" }, // Forest Teal / Emerald
      };
      cell.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "medium", color: { argb: "FF0F2922" } },
        bottom: { style: "medium", color: { argb: "FF84E030" } },
        left: { style: "thin", color: { argb: "FF2D6A53" } },
        right: { style: "thin", color: { argb: "FF2D6A53" } },
      };
    });

    // Add Guest Rows
    if (guests && guests.length > 0) {
      guests.forEach((guest, index) => {
        const row = guestSheet.addRow({
          sr_no: guest.sr_no || index + 1,
          guest_name: guest.guest_name || "",
          contact: guest.contact || "",
          side: guest.side || "Groom",
          relation: guest.relation || "",
          rsvp_status: guest.rsvp_status || "Confirmed",
          id_card_received: guest.id_card_received || "No",
          arrival_date: guest.arrival_date || "",
          arrival_time: guest.arrival_time || "",
          arrival_location: guest.arrival_location || "",
          arrival_flight_train_no: guest.arrival_flight_train_no || "",
          departure_date: guest.departure_date || "",
          departure_time: guest.departure_time || "",
          departure_location: guest.departure_location || "",
          departure_flight_train_no: guest.departure_flight_train_no || "",
          special_request: guest.special_request || "",
          call_status: guest.call_status || "Not Called",
          call_count: guest.call_count || 0,
          last_call_summary: guest.last_call_summary || "",
        });

        row.height = 22;
        const isEven = index % 2 === 0;

        row.eachCell((cell, colNumber) => {
          cell.font = { name: "Calibri", size: 10.5, color: { argb: "FF1E293B" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: isEven ? "FFFFFFFF" : "FFF8FAFC" },
          };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };

          // Align numbers / dates in center, text in left
          if ([1, 4, 5, 6, 7, 8, 11, 12, 16, 17].includes(colNumber)) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          } else {
            cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
          }
        });
      });
    } else {
      // Add sample placeholder row for guidance
      const sampleRow = guestSheet.addRow({
        sr_no: 1,
        guest_name: "Example: Manish Kumar",
        contact: "+91 9876543210",
        side: "Groom",
        rsvp_status: "Confirmed",
        id_card_received: "Yes",
        arrival_date: wedding.wedding_date || "2026-11-28",
        arrival_time: "10:00 AM",
        arrival_location: "Airport / Railway Station",
        arrival_flight_train_no: "AI-101",
        departure_date: wedding.wedding_date || "2026-11-30",
        departure_time: "06:00 PM",
        departure_location: "Airport",
        departure_flight_train_no: "AI-102",
        special_request: "Vegetarian food & cab pickup",
        call_status: "RSVP Confirmed",
        call_count: 1,
        last_call_summary: "Confirmed attendance and room preference.",
      });

      sampleRow.height = 22;
      sampleRow.eachCell((cell) => {
        cell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF64748B" } };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    }

    // -------------------------------------------------------------
    // Save the Excel file to exports directory
    // -------------------------------------------------------------
    const safeGroom = (wedding.groom_name || "Groom").trim().replace(/[^a-zA-Z0-9]/g, "_");
    const safeBride = (wedding.bride_name || "Bride").trim().replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `MarriageSheet_${safeGroom}_${safeBride}_${wedding.id}.xlsx`;
    const filePath = path.join(exportDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    return {
      fileName,
      filePath,
      relativePath: `/exports/${fileName}`,
      downloadUrl: `/api/weddings/${wedding.id}/download-excel`,
    };
  },
};
