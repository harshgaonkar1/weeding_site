import React, { useState, useRef } from "react";
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  Check,
  PlaneLanding,
  ArrowRight,
} from "lucide-react";
import { api } from "../services/api";

// CSV parsing helper supporting quotes and commas
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const parseLine = (line) => {
    const result = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' || c === "'") {
        if (inQuotes && line[i + 1] === c) {
          cur += c;
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((c === "," || c === "\t" || c === ";") && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    if (vals.length === 0 || (vals.length === 1 && !vals[0])) continue;
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = vals[idx] || "";
    });
    rows.push(rowObj);
  }

  return rows;
}

// Map raw row object keys to standardized guest schema
function normalizeGuestRow(raw) {
  const findVal = (keywords) => {
    for (const key of Object.keys(raw)) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (keywords.some((kw) => cleanKey.includes(kw))) {
        return raw[key];
      }
    }
    return "";
  };

  const guest_name = findVal(["name", "guest", "fullname"]) || "";
  const contact = findVal(["contact", "phone", "mobile", "number", "tel", "email"]) || "";
  
  let sideRaw = (findVal(["side", "affiliation", "party"]) || "Groom").toLowerCase();
  let side = sideRaw.includes("bride") ? "Bride" : "Groom";

  let rsvpRaw = (findVal(["rsvp", "status", "attendance"]) || "Confirmed").toLowerCase();
  let rsvp_status = "Confirmed";
  if (rsvpRaw.includes("decline") || rsvpRaw.includes("regret") || rsvpRaw.includes("no") || rsvpRaw.includes("reject")) {
    rsvp_status = "Declined";
  } else if (rsvpRaw.includes("pend") || rsvpRaw.includes("maybe") || rsvpRaw.includes("wait")) {
    rsvp_status = "Pending";
  }

  const arrival_date = findVal(["arrivaldate", "arrdate", "arrival", "checkin"]) || "";
  const arrival_flight_train_no = findVal(["arrivalflight", "arrflight", "flight", "trainno", "flightno"]) || "";
  const arrival_location = findVal(["arrivalloc", "arrloc", "terminal", "airport", "station"]) || "";
  const departure_date = findVal(["departuredate", "depdate", "departure", "checkout"]) || "";
  const departure_flight_train_no = findVal(["departureflight", "depflight", "depflightno"]) || "";
  const departure_location = findVal(["departureloc", "deploc"]) || "";
  const relation = findVal(["relation", "relationship", "relationtowedding", "relationtocouple"]) || "";
  const special_request = findVal(["special", "request", "diet", "meal", "food", "remark", "note"]) || "";

  return {
    guest_name,
    contact,
    side,
    relation,
    rsvp_status,
    id_card_received: "Yes",
    arrival_date,
    arrival_flight_train_no,
    arrival_location,
    departure_date,
    departure_flight_train_no,
    departure_location,
    special_request,
  };
}

export default function ExcelImportModal({
  isOpen,
  weddingId = "wedding_01",
  weddingName = "Wedding",
  onClose,
  onImportSuccess,
}) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Process File (.xlsx, .xls, .csv)
  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);
    setErrorMsg("");

    try {
      const fileName = selectedFile.name.toLowerCase();

      if (fileName.endsWith(".csv") || selectedFile.type === "text/csv") {
        const text = await selectedFile.text();
        const rawRows = parseCSV(text);
        const normalized = rawRows
          .map(normalizeGuestRow)
          .filter((g) => g.guest_name && g.guest_name.trim().length > 0);

        if (normalized.length === 0) {
          throw new Error("No valid guest names found in CSV. Please ensure a 'Guest Name' column exists.");
        }
        setParsedRows(normalized);
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        // Load SheetJS dynamically
        let XLSX = window.XLSX;
        if (!XLSX) {
          const script = document.createElement("script");
          script.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load Excel parser library"));
            document.head.appendChild(script);
          });
          XLSX = window.XLSX;
        }

        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet);

        const normalized = rawJson
          .map(normalizeGuestRow)
          .filter((g) => g.guest_name && String(g.guest_name).trim().length > 0);

        if (normalized.length === 0) {
          throw new Error("No valid guest rows found in the Excel sheet.");
        }
        setParsedRows(normalized);
      } else {
        throw new Error("Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file.");
      }
    } catch (err) {
      console.error("Error parsing file:", err);
      setErrorMsg(err.message || "Failed to read file.");
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const csvContent =
      "Guest Name,Contact,Side,Relation,RSVP Status,Arrival Date,Arrival Flight/Train,Arrival Location,Departure Date,Departure Flight/Train,Special Request\n" +
      "Manish Sharma,+91 98765 43210,Groom,Groom's Brother,Confirmed,08-11-2026,AI-682,Mumbai Int Airport (T2),11-11-2026,AI-894,Vegetarian meal and airport shuttle\n" +
      "Sophia Rodriguez,+1 (555) 234-8901,Bride,Bride's Sister,Confirmed,09-11-2026,6E-241,Goa Airport,12-11-2026,6E-244,Sea facing room preference\n" +
      "Rajesh Patel,+91 98220 11223,Groom,Friend,Pending,08-11-2026,Vande Bharat 22221,Mumbai Central,11-11-2026,Tejas Exp 12952,Jain food preference";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "wedding_guest_directory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Bulk Import
  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);
    setErrorMsg("");

    try {
      await api.bulkImportGuests(weddingId, parsedRows);
      if (onImportSuccess) {
        onImportSuccess(parsedRows.length);
      }
      onClose();
    } catch (err) {
      console.error("Error importing guests:", err);
      setErrorMsg(err.message || "Failed to import guests.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 my-4 relative flex flex-col max-h-[90vh] animate-bounceIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f2922] via-[#163a30] to-[#0f2922] p-5 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#84e030]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-[#84e030]/20 border border-[#84e030]/40 flex items-center justify-center text-[#84e030] shadow-xs animate-pulseGlow">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
                <span>Import Guests from Excel / CSV</span>
                <span className="text-[10px] bg-[#84e030] text-[#0f2922] px-2 py-0.2 rounded-full font-extrabold">
                  Bulk
                </span>
              </h3>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Target Wedding: <strong className="text-white underline">{weddingName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-all hover:scale-110 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-2xl flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-[#f8fafc] hover:bg-[#f2fcf5] rounded-3xl p-6 text-center cursor-pointer transition-all group card-hover-lift"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 group-hover:bg-[#84e030]/30 transition-all">
              <Upload className="w-6 h-6 text-emerald-700 group-hover:text-[#0f2922] transition-colors" />
            </div>
            <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-950 transition-colors">
              {file ? file.name : "Click to select or drag & drop Excel / CSV file"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports <strong>.xlsx</strong>, <strong>.xls</strong>, and <strong>.csv</strong> spreadsheets
            </p>
          </div>

          {/* Download Template Bar */}
          <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 border border-slate-200/90 rounded-2xl p-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-slate-700">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Need the standard template structure?</span>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer btn-interactive"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Download Sample Template</span>
            </button>
          </div>

          {/* Parsed Preview */}
          {isParsing && (
            <div className="py-6 text-center text-slate-500 space-y-2 animate-fadeIn">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-semibold">Reading and parsing spreadsheet rows...</p>
            </div>
          )}

          {parsedRows.length > 0 && !isParsing && (
            <div className="space-y-2 animate-fadeInUp">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ready to import {parsedRows.length} guests:</span>
                </span>
                <span className="text-slate-500 text-[11px]">
                  Previewing first {Math.min(parsedRows.length, 5)} rows
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200/80">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Guest Name</th>
                      <th className="p-2.5">Contact</th>
                      <th className="p-2.5">Side</th>
                      <th className="p-2.5">RSVP</th>
                      <th className="p-2.5">Arrival</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {parsedRows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="p-2.5 text-slate-400 font-bold">{i + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">{row.guest_name}</td>
                        <td className="p-2.5 font-mono text-slate-600">{row.contact || "—"}</td>
                        <td className="p-2.5">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                            {row.side}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-200/60">
                            {row.rsvp_status}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {row.arrival_date || row.arrival_flight_train_no || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer btn-interactive"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={parsedRows.length === 0 || isImporting}
            onClick={handleConfirmImport}
            className="bg-[#0f2922] hover:bg-[#163a30] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 transition-all btn-interactive"
          >
            <Upload className="w-4 h-4 text-[#84e030]" />
            <span>
              {isImporting
                ? "Importing Guests..."
                : `Import ${parsedRows.length} ${parsedRows.length === 1 ? "Guest" : "Guests"}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
