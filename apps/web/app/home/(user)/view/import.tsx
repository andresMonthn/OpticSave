"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { Button } from "@kit/ui/button";
import { Input } from "@kit/ui/input";
import { Label } from "@kit/ui/label";
import { toast } from "@kit/ui/sonner";
import { Upload, FileUp } from "lucide-react";

const supabase = getSupabaseBrowserClient();

type ParsedRow = Record<string, any>;

function detectDelimiter(sample: string) {
  const comma = (sample.match(/,/g) || []).length;
  const semicolon = (sample.match(/;/g) || []).length;
  const tab = (sample.match(/\t/g) || []).length;
  if (tab >= comma && tab >= semicolon) return "\t";
  if (semicolon >= comma) return ";";
  return ",";
}

function normalizeHeader(h: string): string | null {
  const s = h
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/__+/g, "_");

  if (["nombre", "name", "first_name"].includes(s)) return "nombre";
  if (["apellido", "apellidos", "last_name", "surname", "primer_apellido", "segundo_apellido"].includes(s)) return "apellido";
  if (["edad", "age"].includes(s)) return "edad";
  if (["sexo", "genero", "gender"].includes(s)) return "sexo";
  if (["telefono", "tel", "phone", "celular"].includes(s)) return "telefono";
  if (["domicilio", "direccion", "address"].includes(s)) return "domicilio";
  if (["motivo_consulta", "motivo", "razon", "reason", "observaciones"].includes(s)) return "motivo_consulta";
  if (["fecha_de_cita", "fecha", "cita", "appointment_date", "fecha_cita", "fecha_consulta", "fecha_atencion", "fecha_visita"].includes(s)) return "fecha_de_cita";
  if (["estado", "status"].includes(s)) return "estado";
  // ignorar campos sin coincidencia
  return null;
}

function parseCSV(content: string): ParsedRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const delimiter = detectDelimiter(lines[0] as any);

  // soporte básico de comillas
  const splitLine = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        // alternar estado de comillas o escapar comillas dobles
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result.map((v) => v.trim());
  };

  const rawHeaders = splitLine(lines[0] || '');
  const headers = rawHeaders.map((h) => normalizeHeader(String(h ?? "")));
  const rows: ParsedRow[] = [];
  for (let r = 1; r < lines.length; r++) {
    const values = splitLine(lines[r] || '');
    const row: ParsedRow = {};
    headers.forEach((key, idx) => {
      if (typeof key !== 'string') return; // ignorar campos sin coincidencia
      row[key] = values[idx] ?? null;
    });
    rows.push(row);
  }
  return rows;
}

function toNumberOrNull(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function normalizeDate(v: any): string | null {
  if (!v) return null;
  // Manejar objetos Date directamente
  if (v instanceof Date && !isNaN(v.getTime())) {
    const ddStr = v.getDate().toString().padStart(2, "0");
    const mmStr = (v.getMonth() + 1).toString().padStart(2, "0");
    const yyStr = (v.getFullYear() % 100).toString().padStart(2, "0");
    return `${ddStr}/${mmStr}/${yyStr}`;
  }
  // Manejar números seriales de Excel (sistema 1900)
  if (typeof v === "number" && Number.isFinite(v) && v > 25569 && v < 70000) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    const d2 = new Date(excelEpoch + Math.round(v * 86400000));
    if (!isNaN(d2.getTime())) {
      const ddStr = d2.getUTCDate().toString().padStart(2, "0");
      const mmStr = (d2.getUTCMonth() + 1).toString().padStart(2, "0");
      const yyStr = (d2.getUTCFullYear() % 100).toString().padStart(2, "0");
      return `${ddStr}/${mmStr}/${yyStr}`;
    }
  }
  const s = String(v).trim().toLowerCase();

  // Alias de meses en español -> mes numérico "01"..."12"
  const monthAliasesES: Record<string, string[]> = {
    "01": ["enero", "ene"],
    "02": ["febrero", "feb"],
    "03": ["marzo", "mar"],
    "04": ["abril", "abr"],
    "05": ["mayo", "may"],
    "06": ["junio", "jun"],
    "07": ["julio", "jul"],
    "08": ["agosto", "ago"],
    "09": ["septiembre", "setiembre", "sep", "set", "sept"],
    "10": ["octubre", "oct"],
    "11": ["noviembre", "nov"],
    "12": ["diciembre", "dic"],
  };
  // Construimos un diccionario de búsqueda normalizado (sin acentos)
  const monthLookup: Record<string, string> = {};
  for (const [num, aliases] of Object.entries(monthAliasesES)) {
    for (const alias of aliases) {
      const normalized = alias.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      monthLookup[normalized] = num;
    }
  }

  // Intento robusto: tokenizar y buscar mes en español (p. ej. "12 de noviembre 2025")
  {
    const tokens = s.replace(/[\.,;:\/\-]/g, " ").split(/\s+/).filter(Boolean);
    let day: number | null = null;
    let month: number | null = null;
    let year: number | null = null;
    for (const t of tokens) {
      const n = parseInt(t, 10);
      if (!isNaN(n)) {
        if (day === null && n >= 1 && n <= 31) {
          day = n;
          continue;
        }
        if (year === null && (n >= 1000 || n < 100)) {
          year = n;
          continue;
        }
      } else {
        const mName = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const mm2 = monthLookup[mName];
        if (mm2 && month === null) {
          month = parseInt(mm2, 10);
        }
      }
    }
    if (day !== null && month !== null && year !== null) {
      const ddStr = day.toString().padStart(2, "0");
      const mmStr = month.toString().padStart(2, "0");
      const yyStr = (year % 100).toString().padStart(2, "0");
      return `${ddStr}/${mmStr}/${yyStr}`;
    }
  }

  // 2) Formato numérico común: dd/mm/yyyy o dd-mm-yyyy
  const mNumeric = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (mNumeric) {
    const dd = parseInt(mNumeric[1] ?? "0", 10);
    const mm = parseInt(mNumeric[2] ?? "0", 10);
    const yy = parseInt((mNumeric[3] ?? "0"), 10) % 100;
    const ddStr = dd.toString().padStart(2, "0");
    const mmStr = mm.toString().padStart(2, "0");
    const yyStr = yy.toString().padStart(2, "0");
    return `${ddStr}/${mmStr}/${yyStr}`;
  }

  // 3) ISO u otros que Date pueda parsear
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const ddStr = d.getDate().toString().padStart(2, "0");
    const mmStr = (d.getMonth() + 1).toString().padStart(2, "0");
    const yyStr = (d.getFullYear() % 100).toString().padStart(2, "0");
    return `${ddStr}/${mmStr}/${yyStr}`;
  }

  // Sin reconocimiento: devolver tal cual
  return s;
}

// Normaliza a formato "YYYY-MM" (solo números, año-mes)
function normalizeYearMonth(v: any): string | null {
  if (!v) return null;

  const padYear = (y: number) => y.toString().padStart(4, "0");
  const padMonth = (m: number) => m.toString().padStart(2, "0");
  const toFourDigitYear = (y: number) => (y >= 100 ? y : 2000 + y);

  // Date directa
  if (v instanceof Date && !isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = v.getMonth() + 1;
    return `${padYear(y)}-${padMonth(m)}`;
  }

  // Número serial Excel (sistema 1900)
  if (typeof v === "number" && Number.isFinite(v) && v > 25569 && v < 70000) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    const d2 = new Date(excelEpoch + Math.round(v * 86400000));
    if (!isNaN(d2.getTime())) {
      const y = d2.getUTCFullYear();
      const m = d2.getUTCMonth() + 1;
      return `${padYear(y)}-${padMonth(m)}`;
    }
  }

  const s = String(v).trim().toLowerCase();

  // ISO puro YYYY-MM
  {
    const mIsoYm = s.match(/^\s*(\d{4})[\/-](\d{1,2})\s*$/);
    if (mIsoYm) {
      const y = parseInt(mIsoYm[1] ?? "0", 10);
      const m = parseInt(mIsoYm[2] ?? "0", 10);
      if (y && m >= 1 && m <= 12) return `${padYear(y)}-${padMonth(m)}`;
    }
  }

  // ISO completo YYYY-MM-DD
  {
    const mIso = s.match(/^\s*(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})\s*$/);
    if (mIso) {
      const y = parseInt(mIso[1] ?? "0", 10);
      const m = parseInt(mIso[2] ?? "0", 10);
      if (y && m >= 1 && m <= 12) return `${padYear(y)}-${padMonth(m)}`;
    }
  }

  // yyyymmdd o yyyymm
  {
    const mCompactFull = s.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (mCompactFull) {
      const y = parseInt(mCompactFull[1] ?? "0", 10);
      const m = parseInt(mCompactFull[2] ?? "0", 10);
      if (y && m >= 1 && m <= 12) return `${padYear(y)}-${padMonth(m)}`;
    }
    const mCompactYm = s.match(/^(\d{4})(\d{2})$/);
    if (mCompactYm) {
      const y = parseInt(mCompactYm[1] ?? "0", 10);
      const m = parseInt(mCompactYm[2] ?? "0", 10);
      if (y && m >= 1 && m <= 12) return `${padYear(y)}-${padMonth(m)}`;
    }
  }

  // dd/mm/yyyy o dd-mm-yy
  {
    const mNumeric = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
    if (mNumeric) {
      const dd = parseInt(mNumeric[1] ?? "0", 10);
      const mm = parseInt(mNumeric[2] ?? "0", 10);
      let yy = parseInt(mNumeric[3] ?? "0", 10);
      yy = toFourDigitYear(yy);
      if (mm >= 1 && mm <= 12) return `${padYear(yy)}-${padMonth(mm)}`;
    }
  }

  // mm/yyyy o yyyy/mm
  {
    const m1 = s.match(/^(\d{1,2})[\/-](\d{2,4})$/);
    if (m1) {
      const a = parseInt(m1[1] ?? "0", 10);
      let b = parseInt(m1[2] ?? "0", 10);
      // si a es mes, b es año
      if (a >= 1 && a <= 12) {
        b = toFourDigitYear(b);
        return `${padYear(b)}-${padMonth(a)}`;
      }
      // si b tiene 4 dígitos, es año y a sería mes
      if (String(b).length === 4 && a >= 1 && a <= 12) {
        return `${padYear(b)}-${padMonth(a)}`;
      }
    }
    const m2 = s.match(/^(\d{4})[\/-](\d{1,2})$/);
    if (m2) {
      const y = parseInt(m2[1] ?? "0", 10);
      const m = parseInt(m2[2] ?? "0", 10);
      if (m >= 1 && m <= 12) return `${padYear(y)}-${padMonth(m)}`;
    }
  }

  // Mes en español + año (ej: "noviembre 2025", "12 de nov 25")
  {
    const monthAliasesES: Record<string, string[]> = {
      "01": ["enero", "ene"],
      "02": ["febrero", "feb"],
      "03": ["marzo", "mar"],
      "04": ["abril", "abr"],
      "05": ["mayo", "may"],
      "06": ["junio", "jun"],
      "07": ["julio", "jul"],
      "08": ["agosto", "ago"],
      "09": ["septiembre", "setiembre", "sep", "set", "sept"],
      "10": ["octubre", "oct"],
      "11": ["noviembre", "nov"],
      "12": ["diciembre", "dic"],
    };
    const monthLookup: Record<string, string> = {};
    for (const [num, aliases] of Object.entries(monthAliasesES)) {
      for (const alias of aliases) {
        const normalized = alias.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        monthLookup[normalized] = num;
      }
    }
    const tokens = s.replace(/[\.,;:\/\-]/g, " ").split(/\s+/).filter(Boolean);
    let foundMonth: number | null = null;
    let foundYear: number | null = null;
    for (const t of tokens) {
      const n = parseInt(t, 10);
      if (!isNaN(n)) {
        if (String(n).length === 4 && foundYear === null) {
          foundYear = n;
          continue;
        }
        if (String(n).length <= 2 && n >= 1 && n <= 12 && foundMonth === null) {
          foundMonth = n;
          continue;
        }
      } else {
        const mName = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const mm2 = monthLookup[mName];
        if (mm2 && foundMonth === null) {
          foundMonth = parseInt(mm2, 10);
        }
      }
    }
    if (foundMonth !== null && foundYear !== null) {
      return `${padYear(foundYear)}-${padMonth(foundMonth)}`;
    }
  }

  // Fallback: que Date lo pueda parsear
  {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      return `${padYear(y)}-${padMonth(m)}`;
    }
  }

  // No reconocible
  return null;
}

export default function ImportView() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setIsParsing(true);
    setFileName(file.name);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "csv" || ext === "tsv") {
        const text = await file.text();
        const rows = parseCSV(text);
        setParsed(rows);
        toast("Archivo procesado", { description: `Se detectaron ${rows.length} filas.` });
      } else if (ext === "xlsx" || ext === "xls") {
        try {
          // @ts-ignore
          const XLSX = await import("xlsx");
          const data = await file.arrayBuffer();
          const wb = XLSX.read(data, { type: "array" });
          const firstSheetName = wb.SheetNames?.[0];
          if (!firstSheetName || typeof firstSheetName !== 'string') {
            setParsed([]);
            toast("Hoja no disponible", { description: "El archivo Excel no contiene hojas válidas." });
            return;
          }
          const sheet = wb.Sheets[firstSheetName as string];
          if (!sheet) {
            setParsed([]);
            toast("Hoja no disponible", { description: "No se encontró la hoja especificada en el archivo." });
            return;
          }
          const rowsMatrix: any[][] = XLSX.utils.sheet_to_json(sheet!, { header: 1 });
          if (!rowsMatrix || rowsMatrix.length === 0) {
            setParsed([]);
          } else {
            const headerRow = (rowsMatrix[0] ?? []) as any[];
            const headers = headerRow.map((h) => normalizeHeader(String(h ?? "")));
            const rows: ParsedRow[] = [];
            for (let i = 1; i < rowsMatrix.length; i++) {
              const rec: ParsedRow = {};
              headers.forEach((key, idx) => {
                if (typeof key !== 'string') return;
                rec[key] = rowsMatrix[i]?.[idx] ?? null;
              });
              rows.push(rec);
            }
            setParsed(rows);
          }
          toast("Excel procesado", { description: `Se detectaron ${rowsMatrix?.length ? rowsMatrix.length - 1 : 0} filas.` });
        } catch (e) {
          console.error("Error importando XLSX:", e);
          toast("Formato Excel no disponible", { description: "Convierte tu archivo a CSV para importarlo." });
          setParsed([]);
        }
      } else {
        toast("Formato no soportado", { description: "Usa .csv, .tsv o .xlsx/.xls (si disponible)." });
        setParsed([]);
      }
    } finally {
      setIsParsing(false);
    }
  }, []);

  const recordsForInsert = useMemo(() => {
    return parsed
      .map((row) => {
        const nombre = row.nombre ? String(row.nombre).trim() : "";
        const apellido = row.apellido ? String(row.apellido).trim() : "";
        const fullName = [nombre, apellido].filter(Boolean).join(" ").trim();

        const rec: Record<string, any> = {
          nombre: fullName || (nombre || null) || null,
          edad: toNumberOrNull(row.edad),
          sexo: row.sexo ?? null,
          telefono: row.telefono ?? null,
          domicilio: row.domicilio ?? null,
          motivo_consulta: row.motivo_consulta ?? null,
          fecha_de_cita: normalizeYearMonth(row.fecha_de_cita),
          estado: row.estado ?? null,
        };

        // no incluir 'apellido' porque la tabla pacientes no lo tiene
        return rec;
      })
      // filtrar filas sin nombre
      .filter((r) => !!r.nombre && String(r.nombre).trim().length > 0);
  }, [parsed]);

  const handleImport = useCallback(async () => {
    if (recordsForInsert.length === 0) {
      toast("Sin datos para importar", { description: "Asegúrate de que el archivo tenga encabezados y filas válidas." });
      return;
    }
    setIsImporting(true);
    try {
      const { data, error } = await supabase
        .from("pacientes" as unknown as any)
        .insert(recordsForInsert);
      if (error) throw error;
      toast("Importación completa", { description: `Se insertaron ${recordsForInsert.length} paciente(s).` });
    } catch (e: any) {
      console.error(e);
      toast("Error al importar", { description: e?.message || "Revisa el formato del archivo y los campos." });
    } finally {
      setIsImporting(false);
    }
  }, [recordsForInsert]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="file" className="text-xs">Selecciona archivo</Label>
        <Input
          id="file"
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv,.tsv,.xlsx,.xls"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              handleFile(f);
            }
          }}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Elegir archivo"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
          </Button>
          {fileName && (
            <p className="text-xs text-muted-foreground truncate">{fileName}</p>
          )}
        </div>
      </div>

      {parsed.length > 0 && (
        <div className="rounded-md border">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-xs text-muted-foreground">Filas: {parsed.length}</p>
          </div>
          <div className="max-h-44 overflow-auto overflow-x-auto text-xs">
            {(() => {
              const allHeaders = Object.keys(recordsForInsert[0] || {});
              const maxCols = 8;
              const shownHeaders = allHeaders.slice(0, maxCols);
              const hiddenCount = allHeaders.length - shownHeaders.length;
              return (
                <table className="min-w-[640px] text-left">
                  <thead className="sticky top-0 bg-background">
                    <tr>
                      {shownHeaders.map((h) => (
                        <th key={h} className="px-2 py-1 font-medium capitalize whitespace-nowrap">{h.replace(/_/g, " ")}</th>
                      ))}
                      {hiddenCount > 0 && (
                        <th className="px-2 py-1 font-medium text-muted-foreground">+{hiddenCount}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {recordsForInsert.slice(0, 10).map((r, idx) => (
                      <tr key={idx} className="border-t">
                        {shownHeaders.map((h) => (
                          <td key={h} className="px-2 py-1 whitespace-nowrap">{r[h] ?? ""}</td>
                        ))}
                        {hiddenCount > 0 && (
                          <td className="px-2 py-1 text-muted-foreground">…</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button
          disabled={isParsing || recordsForInsert.length === 0 || isImporting}
          onClick={handleImport}
          size="sm"
        >
          {isImporting ? (
            <span className="inline-flex items-center gap-1"><FileUp className="h-4 w-4" /> Importando…</span>
          ) : (
            <span className="inline-flex items-center gap-1"><FileUp className="h-4 w-4" /> Importar</span>
          )}
        </Button>
      </div>
    </div>
  );
}