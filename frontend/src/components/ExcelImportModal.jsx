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
  Heart,
  Sparkles,
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
function normalizeGuestRow(raw, defaultSide = "Groom") {
  const findVal = (keywords) => {
    for (const key of Object.keys(raw)) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (keywords.some((kw) => cleanKey.includes(kw) || kw.includes(cleanKey))) {
        const val = raw[key];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          return String(val).trim();
        }
      }
    }
    return "";
  };

  const guest_name = findVal(["name", "guest", "fullname", "guestname"]) || "";
  const contact = findVal(["contact", "phone", "mobile", "number", "tel", "email"]) || "";
  const relation = findVal(["relation", "relationship", "relationtowedding", "relationtocouple", "relative"]) || "";

  // Side detection
  const sideRaw = findVal([
    "side",
    "bridegroom",
    "groombride",
    "sidebridegroom",
    "sidegroombride",
    "whose",
    "affiliation",
    "party",
    "family",
    "category",
    "ladka",
    "ladki",
  ]);

  let side = null;
  if (sideRaw) {
    const s = sideRaw.toLowerCase().trim();
    if (
      s.includes("bride") ||
      s.includes("ladki") ||
      s.includes("girl") ||
      s.includes("female") ||
      s.includes("wife") ||
      s === "b" ||
      s === "b side" ||
      s === "b/s" ||
      s.startsWith("bride")
    ) {
      side = "Bride";
    } else if (
      s.includes("groom") ||
      s.includes("ladka") ||
      s.includes("ladke") ||
      s.includes("boy") ||
      s.includes("male") ||
      s.includes("husband") ||
      s === "g" ||
      s === "g side" ||
      s === "g/s" ||
      s.startsWith("groom")
    ) {
      side = "Groom";
    } else if (s.includes("both") || s.includes("mutual") || s.includes("common")) {
      side = "Both";
    }
  }

  // If side column was missing or empty, infer from relation
  if (!side) {
    const relLower = relation.toLowerCase().trim();
    if (
      relLower.includes("bride") ||
      relLower.includes("ladki") ||
      relLower.includes("girl") ||
      relLower.includes("female") ||
      relLower.includes("wife")
    ) {
      side = "Bride";
    } else if (
      relLower.includes("groom") ||
      relLower.includes("ladka") ||
      relLower.includes("ladke") ||
      relLower.includes("boy") ||
      relLower.includes("male") ||
      relLower.includes("husband")
    ) {
      side = "Groom";
    } else if (defaultSide) {
      side = defaultSide;
    } else {
      side = "Groom";
    }
  }

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
          .map((r) => normalizeGuestRow(r, "Groom"))
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
        
        let allNormalized = [];
        const isNonGuestSheet = (name) =>
          /summary|dashboard|stats|overview|instructions|readme|settings|template/i.test(name);

        // Read ALL sheets in the workbook (supporting separate Groom and Bride sheets)
        for (const sheetName of workbook.SheetNames) {
          if (isNonGuestSheet(sheetName)) continue;

          let sheetDefaultSide = "Groom";
          const sLower = sheetName.toLowerCase().trim();
          if (sLower.includes("bride") || sLower.includes("ladki") || sLower.includes("girl") || sLower.includes("female")) {
            sheetDefaultSide = "Bride";
          } else if (sLower.includes("groom") || sLower.includes("ladka") || sLower.includes("ladke") || sLower.includes("boy") || sLower.includes("male")) {
            sheetDefaultSide = "Groom";
          }

          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) continue;

          const rawJson = XLSX.utils.sheet_to_json(worksheet);
          if (Array.isArray(rawJson) && rawJson.length > 0) {
            const normalized = rawJson
              .map((r) => normalizeGuestRow(r, sheetDefaultSide))
              .filter((g) => g.guest_name && String(g.guest_name).trim().length > 0);
            allNormalized = allNormalized.concat(normalized);
          }
        }

        if (allNormalized.length === 0) {
          throw new Error("No valid guest rows found in the Excel workbook. Please ensure sheets contain a 'Guest Name' column.");
        }
        setParsedRows(allNormalized);
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
      "Rajesh Patel,+91 98220 11223,Groom,Friend,Pending,08-11-2026,Vande Bharat 22221,Mumbai Central,11-11-2026,Tejas Exp 12952,Jain food preference\n" +
      "Priya Deshmukh,+91 97654 32109,Bride,Bride's Cousin,Confirmed,09-11-2026,UK-945,Mumbai Airport,12-11-2026,UK-946,Near family room";

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

  // Side breakdowns
  const groomCount = parsedRows.filter((r) => r.side === "Groom").length;
  const brideCount = parsedRows.filter((r) => r.side === "Bride").length;
  const bothCount = parsedRows.filter((r) => r.side === "Both").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-[#fbf9f5] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#e3d3be] my-4 relative flex flex-col max-h-[90vh]">
        {/* Header - Burgundy & Beige Luxury Palette */}
        <div className="bg-gradient-to-r from-[#5c1322] via-[#722233] to-[#450e19] p-5 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#eedfc8]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-[#eedfc8]/30 flex items-center justify-center text-[#eedfc8] shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
                <span>Import Guests from Excel / CSV</span>
                <span className="text-[10px] bg-[#eedfc8] text-[#5c1322] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                  Both Sides
                </span>
              </h3>
              <p className="text-xs text-[#eedfc8]/80 mt-0.5">
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
            className="border-2 border-dashed border-[#d4be9e] hover:border-[#722233] bg-[#f7f2ea]/60 hover:bg-[#eedfc8]/40 rounded-3xl p-6 text-center cursor-pointer transition-all group card-hover-lift"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-[#eedfc8]/50 text-[#722233] flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 group-hover:bg-[#722233] group-hover:text-white transition-all shadow-2xs">
              <Upload className="w-6 h-6 transition-colors" />
            </div>
            <p className="text-sm font-bold text-[#3d271d] group-hover:text-[#5c1322] transition-colors">
              {file ? file.name : "Click to select or drag & drop Excel / CSV file"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports multi-sheet workbooks with both <strong>Groom</strong> and <strong>Bride</strong> sheets or single sheet with <strong>Side (Bride/Groom)</strong> column.
            </p>
          </div>

          {/* Download Template Bar */}
          <div className="bg-gradient-to-r from-[#f7f2ea] to-[#eedfc8]/40 border border-[#e3d3be] rounded-2xl p-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-slate-700">
              <FileSpreadsheet className="w-4 h-4 text-[#722233] shrink-0" />
              <span>Need the standard template structure with Bride & Groom columns?</span>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="bg-white hover:bg-slate-50 border border-[#e3d3be] text-[#5c1322] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer btn-interactive text-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#722233]" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Parsed Preview */}
          {isParsing && (
            <div className="py-6 text-center text-slate-500 space-y-2 animate-fadeIn">
              <div className="w-8 h-8 border-3 border-[#722233] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-semibold text-slate-700">Reading sheets and parsing guest data for both sides...</p>
            </div>
          )}

          {parsedRows.length > 0 && !isParsing && (
            <div className="space-y-3 animate-fadeInUp">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ready to import {parsedRows.length} guests:</span>
                </span>
                
                {/* Side Breakdown Pills */}
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  <span className="bg-[#5c1322]/10 text-[#5c1322] border border-[#5c1322]/20 px-2 py-0.5 rounded-full">
                    Groom: {groomCount}
                  </span>
                  <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full">
                    Bride: {brideCount}
                  </span>
                  {bothCount > 0 && (
                    <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                      Both: {bothCount}
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-[#e3d3be] rounded-2xl overflow-hidden shadow-2xs bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f7f2ea] text-slate-700 font-bold border-b border-[#e3d3be]">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Guest Name</th>
                      <th className="p-2.5">Contact</th>
                      <th className="p-2.5">Side</th>
                      <th className="p-2.5">Relation</th>
                      <th className="p-2.5">RSVP</th>
                      <th className="p-2.5">Arrival</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {parsedRows.slice(0, 8).map((row, i) => (
                      <tr key={i} className="hover:bg-[#f7f2ea]/50 transition-colors">
                        <td className="p-2.5 text-slate-400 font-bold">{i + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">{row.guest_name}</td>
                        <td className="p-2.5 font-mono text-slate-600">{row.contact || "—"}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              row.side === "Bride"
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : row.side === "Both"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-[#f7f2ea] text-[#5c1322] border-[#e3d3be]"
                            }`}
                          >
                            {row.side}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600">{row.relation || "—"}</td>
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
                {parsedRows.length > 8 && (
                  <div className="p-2 bg-[#fbf9f5] border-t border-[#e3d3be] text-center text-slate-500 text-[11px]">
                    ...and {parsedRows.length - 8} more guests
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f7f2ea] border-t border-[#e3d3be] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#d4be9e] text-slate-700 hover:bg-white font-semibold cursor-pointer btn-interactive text-xs"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={parsedRows.length === 0 || isImporting}
            onClick={handleConfirmImport}
            className="bg-[#5c1322] hover:bg-[#722233] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 transition-all btn-interactive text-xs"
          >
            <Upload className="w-4 h-4 text-[#eedfc8]" />
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
