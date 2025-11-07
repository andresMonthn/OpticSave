"use client";

import React, { useState } from "react";
import { Button } from "@kit/ui/button";
import { Printer } from "lucide-react";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@kit/ui/dialog";
import { Input } from "@kit/ui/input";
import { Label } from "@kit/ui/label";
import { Textarea } from "@kit/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kit/ui/select";
import { RadioGroup, RadioGroupItem } from "@kit/ui/radio-group";
import { Separator } from "@kit/ui/separator";

// Interfaces para los tipos de datos
interface Paciente {
  id: string;
  nombre: string;
  edad?: string | number;
  sexo?: string;
  telefono?: string;
  domicilio?: string;
  fecha_de_cita?: string;
  motivo_consulta?: string;
  fecha_nacimiento?: string;
  ocupacion?: string;
  sintomas_visuales?: string;
  [key: string]: any;
}

interface Diagnostico {
  id: string;
  paciente_id: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  rx_uso_od_id?: string;
  rx_uso_oi_id?: string;
  rx_final_od_id?: string;
  rx_final_oi_id?: string;
  vb_salud_ocular?: boolean;
  dip?: string;
  [key: string]: any;
}

interface Rx {
  id: string;
  esf?: number | string;
  cil?: number | string;
  eje?: number | string;
  add?: number | string;
  [key: string]: any;
}

interface PrintButtonsProps {
  pacienteId: string;
}

export function PrintButtons({ pacienteId }: PrintButtonsProps) {
  const supabase = getSupabaseBrowserClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [printData, setPrintData] = useState({
    laboratorio: "VALCAST",
    observaciones: "MONTURA PROPIA DE PASTA ARO COMPLETO H 54 V 38 P",
    folio: "",
    material: "CR-39",
    materialOtro: "",
    tratamiento: "Antirreflejante",
    tratamientoOtro: "",
    tipoLente: "Monofocal",
    tipoLenteOtro: "",
    tipoMontura: "Completa",
    tipoMonturaOtro: "",
  });
  const [diagnosticoReciente, setDiagnosticoReciente] = useState<Diagnostico | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [rxMap, setRxMap] = useState<Record<string, Rx>>({});
  const [od, setOd] = useState<Rx | null>(null);
  const [oi, setOi] = useState<Rx | null>(null);

  // Lista de laboratorios comunes
  const laboratorios = [
    "VALCAST",
    "ZEISS",
    "ESSILOR",
    "HOYA",
    "RODENSTOCK",
    "INDO",
    "SHAMIR",
    "OTRO"
  ];

  // Función para cargar los datos necesarios para la impresión
  const cargarDatosImpresion = async () => {
    try {
      // Obtener datos del paciente
      const { data: pacienteData, error: pacienteError } = await supabase
        .from("pacientes" as any)
        .select("*")
        .eq("id", pacienteId)
        .single();

      if (pacienteError) throw pacienteError;

      // Asegurar que pacienteData es del tipo correcto
      if ('error' in pacienteData) {
        throw new Error('Failed to fetch patient data');
      }
      const pacienteObj = pacienteData as unknown as Paciente;
      setPaciente(pacienteObj);

      // Obtener diagnósticos del paciente
      const { data: diagnosticosData, error: diagnosticosError } = await supabase
        .from("diagnostico" as any)
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false })
        .limit(1); // Obtener el diagnóstico más reciente

      if (diagnosticosError) throw diagnosticosError;

      if (!diagnosticosData || diagnosticosData.length === 0) {
        alert("No hay diagnósticos disponibles para este paciente");
        return false;
      }

      // Asegurar que diagnosticoReciente es del tipo correcto
      if (diagnosticosData && diagnosticosData[0] && 'error' in diagnosticosData[0]) {
        throw new Error('Failed to fetch diagnosis data');
      }
      const diagnosticoObj = diagnosticosData[0] as unknown as Diagnostico;
      setDiagnosticoReciente(diagnosticoObj);
      
      // Establecer el folio como el ID del diagnóstico
      setPrintData(prev => ({
        ...prev,
        folio: diagnosticoObj.id,
        observaciones: diagnosticoObj.observaciones || "MONTURA PROPIA DE PASTA ARO COMPLETO H 54 V 38 P"
      }));

      // Obtener recetas asociadas al diagnóstico
      const rxIds: string[] = [
        diagnosticoObj.rx_uso_od_id,
        diagnosticoObj.rx_uso_oi_id,
        diagnosticoObj.rx_final_od_id,
        diagnosticoObj.rx_final_oi_id
      ].filter((id): id is string => !!id); // Filtrar IDs nulos y asegurar que son strings

      if (rxIds.length === 0) {
        alert("No hay recetas disponibles para este paciente");
        return false;
      }

      const { data: rxData, error: rxError } = await supabase
        .from("rx" as any)
        .select("*")
        .in("id", rxIds);

      if (rxError) throw rxError;

      // Mapear recetas por ID para fácil acceso
      const rxMapObj: Record<string, Rx> = {};
      if (rxData) {
        rxData.forEach(rx => {
          rxMapObj[(rx as any).id] = rx as unknown as Rx;
        });
      }
      setRxMap(rxMapObj);
      
      // Determinar qué recetas mostrar (preferir recetas finales)
      const odRx = diagnosticoObj.rx_final_od_id && rxMapObj[diagnosticoObj.rx_final_od_id] 
                ? rxMapObj[diagnosticoObj.rx_final_od_id] 
                : diagnosticoObj.rx_uso_od_id && rxMapObj[diagnosticoObj.rx_uso_od_id]
                ? rxMapObj[diagnosticoObj.rx_uso_od_id]
                : null;
                
      const oiRx = diagnosticoObj.rx_final_oi_id && rxMapObj[diagnosticoObj.rx_final_oi_id]
                ? rxMapObj[diagnosticoObj.rx_final_oi_id]
                : diagnosticoObj.rx_uso_oi_id && rxMapObj[diagnosticoObj.rx_uso_oi_id]
                ? rxMapObj[diagnosticoObj.rx_uso_oi_id]
                : null;

      setOd(odRx ?? null);
      setOi(oiRx ?? null);

      if (!odRx && !oiRx) {
        alert("No se encontraron recetas válidas para imprimir");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error al cargar datos para impresión:", error);
      alert("Error al cargar datos para impresión");
      return false;
    }
  };

  // Función para imprimir datos del paciente
  const handlePrintPatient = async () => {
    try {
      // Obtener datos del paciente
      const { data: pacienteData, error: pacienteError } = await supabase
        .from("pacientes" as any)
        .select("*")
        .eq("id", pacienteId)
        .single();

      if (pacienteError) throw pacienteError;

      // Asegurar que pacienteData es del tipo correcto
      const paciente = pacienteData as unknown as Paciente;

      // Crear contenido HTML para imprimir
      const printContent = `
        <html>
          <head>
            <title>Datos del Paciente</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 20px;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 10px;
              }
              .patient-info {
                margin-bottom: 20px;
              }
              .section {
                margin-bottom: 15px;
              }
              .label {
                font-weight: bold;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>PRECISO</h1>
              <h2>Ficha del Paciente</h2>
              <p>Fecha de impresión: ${format(new Date(), "PPP", { locale: es })}</p>
            </div>
            
            <div class="patient-info">
              <h3>Información Personal</h3>
              <div class="section">
                <span class="label">Nombre:</span> ${paciente.nombre}
              </div>
              <div class="section">
                <span class="label">Edad:</span> ${paciente.edad || 'No especificada'}
              </div>
              <div class="section">
                <span class="label">Sexo:</span> ${paciente.sexo || 'No especificado'}
              </div>
              <div class="section">
                <span class="label">Teléfono:</span> ${paciente.telefono || 'No especificado'}
              </div>
             
              <div class="section">
                <span class="label">Domicilio:</span> ${paciente.domicilio || 'No especificado'}
              </div>
              <div class="section">
                <span class="label">Fecha de cita:</span> ${paciente.fecha_de_cita ? format(new Date(paciente.fecha_de_cita), "PPP", { locale: es }) : 'No especificada'}
              </div>
              <div class="section">
                <span class="label">Motivo de consulta:</span> ${paciente.motivo_consulta || 'No especificado'}
              </div>
            </div>
          </body>
        </html>
      `;

      // Abrir ventana de impresión
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        // Esperar a que el contenido se cargue antes de imprimir
        setTimeout(() => {
          printWindow.print();
          // No cerramos la ventana para permitir al usuario guardar como PDF si lo desea
        }, 500);
      }
    } catch (error) {
      console.error("Error al imprimir datos del paciente:", error);
      alert("Error al imprimir datos del paciente");
    }
  };

  // Función para abrir el diálogo de impresión de RX
  const handleOpenRxDialog = async () => {
    const datosDisponibles = await cargarDatosImpresion();
    if (datosDisponibles) {
      setDialogOpen(true);
    }
  };

  // Función para imprimir orden de RX con los datos del diálogo
  const handlePrintRxWithData = () => {
    try {
      if (!paciente || !diagnosticoReciente || (!od && !oi)) {
        alert("Faltan datos necesarios para la impresión");
        return;
      }

      // Actualizar el estado del paciente a 'ENVIO DE RECETA' usando Supabase directamente
      try {
        // Actualizar el estado del paciente a 'ENVIO DE RECETA' usando Supabase directamente
        supabase
          .from("pacientes" as any)
          .update({ estado: 'ENVIO DE RECETA' })
          .eq("id", pacienteId);
          
        // Disparar un evento para notificar que el estado del paciente ha cambiado
        const event = new CustomEvent('pacienteEstadoActualizado', { 
          detail: { pacienteId, nuevoEstado: 'ENVIO DE RECETA' } 
        });
        window.dispatchEvent(event);
        console.log("Estado del paciente actualizado a 'ENVIO DE RECETA'");
      } catch (error: any) {
        console.error("Error al actualizar estado del paciente:", error);
      }

      // Crear contenido HTML para imprimir la orden de RX
      const printContent = `
        <html>
          <head>
            <title>Orden de Laboratorio</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                font-size: 12px;
              }
              .container {
                width: 90%;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                text-align: center;
                margin-bottom: 10px;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                text-align: center;
                margin: 10px 0;
                text-transform: uppercase;
              }
              .info-row {
                display: flex;
                border: 1px solid #000;
                margin-bottom: 5px;
              }
              .info-cell {
                padding: 5px;
                border-right: 1px solid #000;
                flex: 1;
              }
              .info-cell:last-child {
                border-right: none;
              }
              .label {
                font-weight: bold;
                display: inline-block;
                min-width: 120px;
              }
              .rx-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
              }
              .rx-table th, .rx-table td {
                border: 1px solid #000;
                padding: 5px;
                text-align: center;
              }
              .rx-table th {
                background-color: #f2f2f2;
              }
              .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 10px;
              }
              .observations {
                margin-top: 10px;
                border: 1px solid #000;
                padding: 5px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="title">ORDEN DE LABORATORIO</div>
              
              <div class="info-row">
                <div class="info-cell">
                  <span class="label">Nombre Optica:</span> PRECISO
                </div>
                <div class="info-cell">
                  <span class="label">ORDEN DE TRABAJO NRO.-</span> ${printData.folio || diagnosticoReciente.id}
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-cell">
                  <span class="label">Fecha Creación:</span> ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                </div>
                <div class="info-cell">
                  <span class="label">Paciente:</span> ${paciente.nombre}
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-cell" style="flex: 2;">
                  <span class="label">Laboratorio:</span> ${printData.laboratorio}
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-cell">
                  <span class="label">Observación:</span> ${printData.observaciones}
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-cell">
                  <span class="label">Ojo:</span> AMBOS
                </div>
              </div>

               <div class="info-row">
                <div class="info-cell">
                  <span class="label">Dip:</span> ${diagnosticoReciente.dip}
                </div>
              </div>
              
              <div class="title">FÓRMULA DEFINITIVA</div>
              
              <table class="rx-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>MATERIAL: ${printData.material === "Otro" ? printData.materialOtro : printData.material}</th>
                    <th colspan="4">TIPO DE LENTE: ${printData.tipoLente === "Otro" ? printData.tipoLenteOtro : printData.tipoLente}</th>
                  </tr>
                  <tr>
                    <th></th>
                    <th>ESF</th>
                    <th>CIL</th>
                    <th>EJE</th>
                    <th>ADD</th>
                    <th>DNP(C)</th>
                    <th>DNP(L)</th>
                    <th>ALT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>OD</strong></td>
                    <td>${od ? (od.esf === 'N' ? 'N' : od.esf !== undefined ? typeof od.esf === 'number' ? od.esf.toFixed(2) : od.esf : '') : ''}</td>
                    <td>${od ? (od.cil === 'N' ? 'N' : od.cil !== undefined ? typeof od.cil === 'number' ? od.cil.toFixed(2) : od.cil : '') : ''}</td>
                    <td>${od ? (od.eje === 'N' ? 'N' : od.eje || '') : ''}</td>
                    <td>${od ? (od.add === 'N' ? 'N' : od.add !== undefined ? typeof od.add === 'number' ? od.add.toFixed(2) : od.add : '') : ''}</td>
                    <td>30.00</td>
                    <td></td>
                    <td>26</td>
                  </tr>
                  <tr>
                    <td><strong>OI</strong></td>
                    <td>${oi ? (oi.esf === 'N' ? 'N' : oi.esf !== undefined ? typeof oi.esf === 'number' ? oi.esf.toFixed(2) : oi.esf : '') : ''}</td>
                    <td>${oi ? (oi.cil === 'N' ? 'N' : oi.cil !== undefined ? typeof oi.cil === 'number' ? oi.cil.toFixed(2) : oi.cil : '') : ''}</td>
                    <td>${oi ? (oi.eje === 'N' ? 'N' : oi.eje || '') : ''}</td>
                    <td>${oi ? (oi.add === 'N' ? 'N' : oi.add !== undefined ? typeof oi.add === 'number' ? oi.add.toFixed(2) : oi.add : '') : ''}</td>
                    <td>30.00</td>
                    <td></td>
                    <td>26</td>
                  </tr>
                </tbody>
              </table>
              
              <div style="margin-top: 15px; border: 1px solid #000; padding: 5px;">
                <strong>Tratamiento:</strong> ${printData.tratamiento === "Otro" ? printData.tratamientoOtro : printData.tratamiento}
              </div>
              
              <div style="margin-top: 15px; border: 1px solid #000; padding: 5px;">
                <strong>Tipo de Montura:</strong> ${printData.tipoMontura === "Otro" ? printData.tipoMonturaOtro : printData.tipoMontura}
              </div>
              
              <div class="observations">
                <strong>Observaciones:</strong> ${printData.observaciones}
              </div>
              
              <div class="footer">
                Made by www.opticSave.com
              </div>
            </div>
          </body>
        </html>
      `;

      // Abrir ventana de impresión
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        // Esperar a que el contenido se cargue antes de imprimir
        setTimeout(() => {
          printWindow.print();
          // No cerramos la ventana para permitir al usuario guardar como PDF si lo desea
        }, 500);
      }

      // Cerrar el diálogo después de imprimir
      setDialogOpen(false);
    } catch (error) {
      console.error("Error al imprimir orden de RX:", error);
      alert("Error al imprimir orden de RX");
    }
  };

  return (
    <>
      <div className="flex justify-center gap-4 my-6">
        <Button 
          variant="outline" 
          onClick={handlePrintPatient}
          className="flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Imprimir Paciente
        </Button>
        <Button 
          onClick={handleOpenRxDialog}
          className="flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Imprimir Orden RX
        </Button>
      </div>

      {/* Diálogo para introducir datos antes de imprimir */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">Datos para la Orden de RX</DialogTitle>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Folio</p>
                <p className="text-sm font-mono">{printData.folio}</p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-6 py-4 px-6">
            <div className="mx-auto max-w-xs pt-4">
              <Label htmlFor="laboratorio" className="mb-2 block text-center">Laboratorio</Label>
              <Select
                value={printData.laboratorio}
                onValueChange={(value) => {
                  if (value === "OTRO") {
                    const customLaboratorio = prompt("Por favor, especifique el laboratorio:");
                    if (customLaboratorio) {
                      if (!laboratorios.includes(customLaboratorio.toUpperCase())) {
                        laboratorios.push(customLaboratorio.toUpperCase());
                      }
                      setPrintData({ ...printData, laboratorio: customLaboratorio.toUpperCase() });
                    }
                  } else {
                    setPrintData({ ...printData, laboratorio: value });
                  }
                }}
              >
                <SelectTrigger id="laboratorio">
                  <SelectValue placeholder="Seleccione laboratorio" />
                </SelectTrigger>
                <SelectContent>
                  {laboratorios.map(lab => (
                    <SelectItem key={lab} value={lab}>{lab}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border p-4">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <Label className="mb-2 block">Material</Label>
                    <RadioGroup
                      value={printData.material}
                      onValueChange={(value) => setPrintData({ ...printData, material: value })}
                      className="grid grid-cols-3 gap-x-4 gap-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="CR-39" id="mat-cr39" />
                        <Label htmlFor="mat-cr39" className="font-normal">CR-39</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Policarbonato" id="mat-poli" />
                        <Label htmlFor="mat-poli" className="font-normal">Policarbonato</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Trivex" id="mat-trivex" />
                        <Label htmlFor="mat-trivex" className="font-normal">Trivex</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Alto Indice 1.61" id="mat-161" />
                        <Label htmlFor="mat-161" className="font-normal">Alto Índice 1.61</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Alto Indice 1.67" id="mat-167" />
                        <Label htmlFor="mat-167" className="font-normal">Alto Índice 1.67</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Otro" id="mat-otro" />
                        <Label htmlFor="mat-otro" className="font-normal">Otro</Label>
                      </div>
                    </RadioGroup>
                    {printData.material === "Otro" && (
                      <div className="mt-2">
                        <Input
                          placeholder="Especificar material"
                          value={printData.materialOtro}
                          onChange={(e) => setPrintData({ ...printData, materialOtro: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="mb-2 block">Tipo de Lente</Label>
                    <RadioGroup
                      value={printData.tipoLente}
                      onValueChange={(value) => setPrintData({ ...printData, tipoLente: value })}
                      className="grid grid-cols-3 gap-x-4 gap-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Monofocal" id="lente-mono" />
                        <Label htmlFor="lente-mono" className="font-normal">Monofocal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Bifocal" id="lente-bifo" />
                        <Label htmlFor="lente-bifo" className="font-normal">Bifocal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Progresivo" id="lente-prog" />
                        <Label htmlFor="lente-prog" className="font-normal">Progresivo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Otro" id="lente-otro" />
                        <Label htmlFor="lente-otro" className="font-normal">Otro</Label>
                      </div>
                    </RadioGroup>
                    {printData.tipoLente === "Otro" && (
                      <div className="mt-2">
                        <Input
                          placeholder="Especificar tipo de lente"
                          value={printData.tipoLenteOtro}
                          onChange={(e) => setPrintData({ ...printData, tipoLenteOtro: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <Label className="mb-2 block">Tratamiento</Label>
                    <RadioGroup
                      value={printData.tratamiento}
                      onValueChange={(value) => setPrintData({ ...printData, tratamiento: value })}
                      className="grid grid-cols-2 gap-x-4 gap-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Antirreflejante" id="trat-anti" />
                        <Label htmlFor="trat-anti" className="font-normal">Antirreflejante</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Fotocromático" id="trat-foto" />
                        <Label htmlFor="trat-foto" className="font-normal">Fotocromático</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Polarizado" id="trat-pola" />
                        <Label htmlFor="trat-pola" className="font-normal">Polarizado</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Blue Light" id="trat-blue" />
                        <Label htmlFor="trat-blue" className="font-normal">Blue Light</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Otro" id="trat-otro" />
                        <Label htmlFor="trat-otro" className="font-normal">Otro</Label>
                      </div>
                    </RadioGroup>
                    {printData.tratamiento === "Otro" && (
                      <div className="mt-2">
                        <Input
                          placeholder="Especificar tratamiento"
                          value={printData.tratamientoOtro}
                          onChange={(e) => setPrintData({ ...printData, tratamientoOtro: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="mb-2 block">Tipo de Montura</Label>
                    <RadioGroup
                      value={printData.tipoMontura}
                      onValueChange={(value) => setPrintData({ ...printData, tipoMontura: value })}
                      className="grid grid-cols-3 gap-x-4 gap-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Completa" id="mont-comp" />
                        <Label htmlFor="mont-comp" className="font-normal">Completa</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Semi-Rim" id="mont-semi" />
                        <Label htmlFor="mont-semi" className="font-normal">Semi-Rim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Al Aire" id="mont-aire" />
                        <Label htmlFor="mont-aire" className="font-normal">Al Aire</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Otro" id="mont-otro" />
                        <Label htmlFor="mont-otro" className="font-normal">Otro</Label>
                      </div>
                    </RadioGroup>
                    {printData.tipoMontura === "Otro" && (
                      <div className="mt-2">
                        <Input
                          placeholder="Especificar tipo de montura"
                          value={printData.tipoMonturaOtro}
                          onChange={(e) => setPrintData({ ...printData, tipoMonturaOtro: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                placeholder="Observaciones del diagnóstico"
                value={printData.observaciones}
                onChange={(e) => setPrintData({ ...printData, observaciones: e.target.value })}
                rows={3}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePrintRxWithData}>Imprimir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}