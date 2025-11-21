"use client";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, RefreshCw, Calendar as CalendarIcon, Users } from "lucide-react";
import { format, isSameDay, startOfDay, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useEffect, useRef } from "react";
import { HomeLayoutPageHeader } from '../../(user)/_components/home-page-header';
import { Trans } from '@kit/ui/trans';
import { PageBody } from '@kit/ui/page';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
// Constante para monitorear la fecha actual
const FECHA_HOY = startOfDay(new Date());
// Importaciones de componentes UI desde @kit/ui
import { Button } from "@kit/ui/button";
import { Input } from "@kit/ui/input";
import { Label } from "@kit/ui/label";
import { Textarea } from "@kit/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { RadioGroup, RadioGroupItem } from "@kit/ui/radio-group";
import { Calendar } from "@kit/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@kit/ui/popover";
import { Switch } from "@kit/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@kit/ui/tooltip";
import { Badge } from "@kit/ui/badge";
import { Checkbox } from "@kit/ui/checkbox";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
// Offline hooks y DB
import { useOffline } from "../_lib/offline/useOffline";
import { usePacientesDB } from "../_lib/offline/useDB";
// Importaciones para notificaciones y correos

import { Paciente, DomicilioCompleto, CitaInfo } from "./types";

type DatosPersonalesProps = {
  nombre: string;
  setNombre: (v: string) => void;
  touched: Record<string, boolean>;
  handleBlur: (field: string) => void;
  fechaNacimientoOpen: boolean;
  setFechaNacimientoOpen: (v: boolean) => void;
  fechaNacimiento: Date | undefined;
  setFechaNacimiento: (d: Date | undefined) => void;
  edad: string;
  setEdad: (v: string) => void;
  telefono: string;
  handleTelefonoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  telefonoError: string | null;
  sexo: string;
  setSexo: (v: string) => void;
  nombreRef?: React.RefObject<HTMLInputElement | null>;
  telefonoRef?: React.RefObject<HTMLInputElement | null>;
};

function DatosPersonalesSection({ nombre, setNombre, touched, handleBlur, fechaNacimientoOpen, setFechaNacimientoOpen, fechaNacimiento, setFechaNacimiento, edad, setEdad, telefono, handleTelefonoChange, telefonoError, sexo, setSexo, nombreRef, telefonoRef }: DatosPersonalesProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
          <Input id="nombre" ref={nombreRef} value={nombre} onChange={(e) => setNombre(e.target.value)} onBlur={() => handleBlur('nombre')} placeholder="Ingrese el nombre" required autoComplete="off" className={touched['nombre'] && nombre.trim() === "" ? "border-red-300" : ""} />
          {touched['nombre'] && nombre.trim() === "" && (
            <p className="text-red-500 text-xs">Este campo es requerido</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
          <Popover open={fechaNacimientoOpen} onOpenChange={setFechaNacimientoOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" id="fechaNacimiento" className="w-full justify-between font-normal">
                {fechaNacimiento ? format(fechaNacimiento, "PPP", { locale: es }) : "Seleccionar fecha"}
                <CalendarIcon className="h-4 w-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
              <Calendar mode="single" selected={fechaNacimiento} captionLayout="dropdown" onSelect={(date) => {
                setFechaNacimiento(date);
                if (date) {
                  const hoy = new Date();
                  let edadCalculada = hoy.getFullYear() - date.getFullYear();
                  const m = hoy.getMonth() - date.getMonth();
                  if (m < 0 || (m === 0 && hoy.getDate() < date.getDate())) {
                    edadCalculada--;
                  }
                  setEdad(edadCalculada.toString());
                }
                setFechaNacimientoOpen(false);
              }} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edad">Edad</Label>
          <Input id="edad" type="number" value={edad} onChange={(e) => setEdad(e.target.value)} placeholder="Ingrese la edad" autoComplete="off" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" ref={telefonoRef} value={telefono} onChange={handleTelefonoChange} onBlur={() => handleBlur('telefono')} placeholder="Ingrese el teléfono (10 dígitos)" maxLength={10} autoComplete="off" className={telefonoError ? "border-red-300" : ""} />
          {telefonoError && (
            <p className="text-red-500 text-xs">{telefonoError}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Sexo</Label>
        <RadioGroup value={sexo} onValueChange={setSexo} className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="femenino" id="femenino" />
            <Label htmlFor="femenino">Femenino</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="masculino" id="masculino" />
            <Label htmlFor="masculino">Masculino</Label>
          </div>
        </RadioGroup>
      </div>
    </>
  );
}

type DomicilioProps = {
  domicilioCompleto: boolean;
  setDomicilioCompleto: (v: boolean) => void;
  domicilio: string;
  setDomicilio: (v: string) => void;
  domicilioFields: DomicilioCompleto;
  handleDomicilioFieldChange: (field: keyof DomicilioCompleto, value: string) => void;
};

function DomicilioSection({ domicilioCompleto, setDomicilioCompleto, domicilio, setDomicilio, domicilioFields, handleDomicilioFieldChange }: DomicilioProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="domicilio-switch">Domicilio</Label>
        <div className="flex items-center space-x-2">
          <Label htmlFor="domicilio-switch" className="text-sm">Simple</Label>
          <Switch id="domicilio-switch" checked={domicilioCompleto} onCheckedChange={setDomicilioCompleto} />
          <Label htmlFor="domicilio-switch" className="text-sm">Completo</Label>
        </div>
      </div>
      {!domicilioCompleto ? (
        <Input id="domicilio" value={domicilio} onChange={(e) => setDomicilio(e.target.value)} placeholder="Ingrese el domicilio" autoComplete="off" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="calle">Calle</Label>
            <Input id="calle" value={domicilioFields.calle} onChange={(e) => handleDomicilioFieldChange('calle', e.target.value)} placeholder="Ingrese la calle" autoComplete="off" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numero">Número</Label>
            <Input id="numero" value={domicilioFields.numero} onChange={(e) => handleDomicilioFieldChange('numero', e.target.value)} placeholder="Número exterior" autoComplete="off" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interior">Interior (opcional)</Label>
            <Input id="interior" value={domicilioFields.interior} onChange={(e) => handleDomicilioFieldChange('interior', e.target.value)} placeholder="Número interior" autoComplete="off" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="colonia">Colonia</Label>
            <Input id="colonia" value={domicilioFields.colonia} onChange={(e) => handleDomicilioFieldChange('colonia', e.target.value)} placeholder="Ingrese la colonia" autoComplete="off" />
          </div>
        </div>
      )}
    </div>
  );
}

type MotivoProps = {
  motivoConsulta: string;
  setMotivoConsulta: (v: string) => void;
  motivoConsultaOtro: string;
  setMotivoConsultaOtro: (v: string) => void;
};

function MotivoConsultaSection({ motivoConsulta, setMotivoConsulta, motivoConsultaOtro, setMotivoConsultaOtro }: MotivoProps) {
  return (
    <div className="space-y-2">
      <Label>Motivo de Consulta</Label>
      <RadioGroup value={motivoConsulta} onValueChange={setMotivoConsulta} className="space-y-2 flex flex-col">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Revisión de rutina" id="revision-rutina" />
          <Label htmlFor="revision-rutina" className="font-normal">Revisión de rutina</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Visión borrosa" id="vision-borrosa" />
          <Label htmlFor="vision-borrosa" className="font-normal">Visión borrosa</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Dolor o molestia ocular" id="dolor-ocular" />
          <Label htmlFor="dolor-ocular" className="font-normal">Dolor o molestia ocular</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Revisión de lentes" id="revision-lentes" />
          <Label htmlFor="revision-lentes" className="font-normal">Revisión de lentes</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Otro" id="otro-motivo" />
          <Label htmlFor="otro-motivo" className="font-normal">Otro</Label>
        </div>
        {motivoConsulta === "Otro" && (
          <div className="pl-6 pt-2">
            <Input placeholder="Especifique el motivo" value={motivoConsulta === "Otro" ? motivoConsultaOtro : ""} onChange={(e) => setMotivoConsultaOtro(e.target.value)} className="w-full" autoComplete="off" />
          </div>
        )}
      </RadioGroup>
    </div>
  );
}

type OcupacionExamenProps = {
  ocupacion: string;
  setOcupacion: (v: string) => void;
  ultimoExamenVisual: string;
  setUltimoExamenVisual: (v: string) => void;
};

function OcupacionExamenSection({ ocupacion, setOcupacion, ultimoExamenVisual, setUltimoExamenVisual }: OcupacionExamenProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="ocupacion">Ocupación</Label>
        <Input id="ocupacion" value={ocupacion} onChange={(e) => setOcupacion(e.target.value)} placeholder="Ingrese la ocupación" autoComplete="off" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ultimoExamenVisual">Último Examen Visual</Label>
        <Input id="ultimoExamenVisual" type="number" min={0} step={1} value={ultimoExamenVisual} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setUltimoExamenVisual(v); }} placeholder="¿Cuántos años aproximadamente?" autoComplete="off" />
        <div className="text-xs text-muted-foreground">
          {ultimoExamenVisual ? `${parseInt(ultimoExamenVisual, 10)} ${parseInt(ultimoExamenVisual, 10) === 1 ? 'año' : 'años'}` : 'Indique un número entero, por ejemplo: 1, 2, 3'}
        </div>
      </div>
    </div>
  );
}

type SintomasProps = {
  sintomasVisualesSeleccionados: string[];
  setSintomasVisualesSeleccionados: (v: string[]) => void;
  sintomasVisualesOtro: string;
  setSintomasVisualesOtro: (v: string) => void;
};

function SintomasVisualesSection({ sintomasVisualesSeleccionados, setSintomasVisualesSeleccionados, sintomasVisualesOtro, setSintomasVisualesOtro }: SintomasProps) {
  const toggle = (checked: boolean, sintoma: string) => {
    if (checked) setSintomasVisualesSeleccionados([...sintomasVisualesSeleccionados, sintoma]);
    else setSintomasVisualesSeleccionados(sintomasVisualesSeleccionados.filter((item) => item !== sintoma));
  };
  return (
    <div className="space-y-2">
      <Label htmlFor="sintomasVisuales">Síntomas Visuales</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
        {["Visión borrosa de lejos","Visión borrosa de cerca","Dolor de cabeza","Ardor o picazón ocular","Lagrimeo","Enrojecimiento ocular","Sensibilidad a la luz solar","Sensibilidad a la luz artificial","Ve doble (diplopía)","Moscas volantes o destellos","Pérdida momentánea de visión"].map((sintoma) => (
          <div key={sintoma} className="flex items-center space-x-2">
            <Checkbox id={`sintoma-${sintoma}`} checked={sintomasVisualesSeleccionados.includes(sintoma)} onCheckedChange={(checked) => toggle(!!checked, sintoma)} />
            <Label htmlFor={`sintoma-${sintoma}`} className="font-normal">{sintoma}</Label>
          </div>
        ))}
        <div className="flex items-center space-x-2">
          <Checkbox id="sintoma-otro" checked={sintomasVisualesSeleccionados.includes("Otro")} onCheckedChange={(checked) => { if (checked) setSintomasVisualesSeleccionados([...sintomasVisualesSeleccionados, "Otro"]); else { setSintomasVisualesSeleccionados(sintomasVisualesSeleccionados.filter((item) => item !== "Otro")); setSintomasVisualesOtro(""); } }} />
          <Label htmlFor="sintoma-otro" className="font-normal">Otro</Label>
        </div>
      </div>
      {sintomasVisualesSeleccionados.includes("Otro") && (
        <div className="pt-2">
          <Input placeholder="Especifique otros síntomas visuales" value={sintomasVisualesOtro} onChange={(e) => setSintomasVisualesOtro(e.target.value)} className="w-full" />
        </div>
      )}
    </div>
  );
}

type LentesProps = {
  usaLentes: boolean;
  setUsaLentes: (v: boolean) => void;
  tipoLentesSeleccionados: string[];
  setTipoLentesSeleccionados: (v: string[]) => void;
  tiempoUsoLentes: string;
  setTiempoUsoLentes: (v: string) => void;
};

function LentesSection({ usaLentes, setUsaLentes, tipoLentesSeleccionados, setTipoLentesSeleccionados, tiempoUsoLentes, setTiempoUsoLentes }: LentesProps) {
  const toggleTipo = (checked: boolean, tipo: string) => {
    if (checked) setTipoLentesSeleccionados([...tipoLentesSeleccionados, tipo]);
    else setTipoLentesSeleccionados(tipoLentesSeleccionados.filter((t) => t !== tipo));
  };
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="usaLentes">¿Usa Lentes?</Label>
          <div className="flex items-center gap-2"><span className="text-sm font-medium">{usaLentes ? "Sí" : "No"}</span><Switch id="usaLentes" checked={usaLentes} onCheckedChange={setUsaLentes} /></div>
        </div>
      </div>
      {usaLentes && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Lentes</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[["Monofocales","lentes-monofocales"],["Bifocales","lentes-bifocales"],["Progresivos","lentes-progresivos"],["De contacto","lentes-contacto"]].map(([label,id]) => (
                <div key={id as string} className="flex items-center space-x-2">
                  <Checkbox id={id as string} checked={tipoLentesSeleccionados.includes(label as string)} onCheckedChange={(checked) => toggleTipo(!!checked, label as string)} />
                  <Label htmlFor={id as string} className="font-normal">{label as string}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tiempoUsoLentes">Tiempo de Uso de Lentes</Label>
            <Input id="tiempoUsoLentes" value={tiempoUsoLentes} onChange={(e) => setTiempoUsoLentes(e.target.value)} placeholder="Tiempo que lleva usando lentes" className="h-full" />
          </div>
        </div>
      )}
    </>
  );
}

type CirugiasTraumaProps = {
  cirugiasOculares: boolean;
  setCirugiasOculares: (v: boolean) => void;
  traumatismosOculares: boolean;
  setTraumatismosOculares: (v: boolean) => void;
  traumatismosDetalle: string;
  setTraumatismosDetalle: (v: string) => void;
};

function CirugiasTraumatismosSection({ cirugiasOculares, setCirugiasOculares, traumatismosOculares, setTraumatismosOculares, traumatismosDetalle, setTraumatismosDetalle }: CirugiasTraumaProps) {
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="cirugiasOculares">¿Ha tenido cirugías oculares?</Label>
          <div className="flex items-center gap-2"><span className="text-sm font-medium">{cirugiasOculares ? "Sí" : "No"}</span><Switch id="cirugiasOculares" checked={cirugiasOculares} onCheckedChange={setCirugiasOculares} /></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="traumatismosOculares">¿Ha tenido traumatismos oculares?</Label>
          <div className="flex items-center gap-2"><span className="text-sm font-medium">{traumatismosOculares ? "Sí" : "No"}</span><Switch id="traumatismosOculares" checked={traumatismosOculares} onCheckedChange={setTraumatismosOculares} /></div>
        </div>
      </div>
      {traumatismosOculares && (
        <div className="space-y-2">
          <Label htmlFor="traumatismosDetalle">Detalles de Traumatismos Oculares</Label>
          <Textarea id="traumatismosDetalle" value={traumatismosDetalle} onChange={(e) => setTraumatismosDetalle(e.target.value)} placeholder="Describa los traumatismos oculares" className="min-h-[80px]" />
        </div>
      )}
    </>
  );
}

type AntecedentesVisualesProps = {
  antecedentesVisualesFamiliaresSeleccionados: string[];
  setAntecedentesVisualesFamiliaresSeleccionados: (v: string[]) => void;
  antecedentesVisualesFamiliaresOtros: string;
  setAntecedentesVisualesFamiliaresOtros: (v: string) => void;
  antecedentesVisualesFamiliaresError: string | null;
  setAntecedentesVisualesFamiliaresError: (v: string | null) => void;
};

function AntecedentesVisualesSection({ antecedentesVisualesFamiliaresSeleccionados, setAntecedentesVisualesFamiliaresSeleccionados, antecedentesVisualesFamiliaresOtros, setAntecedentesVisualesFamiliaresOtros, antecedentesVisualesFamiliaresError, setAntecedentesVisualesFamiliaresError }: AntecedentesVisualesProps) {
  const toggle = (checked: boolean, antecedente: string) => {
    if (checked) {
      if (antecedentesVisualesFamiliaresSeleccionados.includes("Ninguno")) {
        setAntecedentesVisualesFamiliaresSeleccionados(antecedentesVisualesFamiliaresSeleccionados.filter(item => item !== "Ninguno").concat(antecedente));
      } else {
        setAntecedentesVisualesFamiliaresSeleccionados([...antecedentesVisualesFamiliaresSeleccionados, antecedente]);
      }
      setAntecedentesVisualesFamiliaresError(null);
    } else {
      setAntecedentesVisualesFamiliaresSeleccionados(antecedentesVisualesFamiliaresSeleccionados.filter((item) => item !== antecedente));
    }
  };
  return (
    <div className="space-y-2">
      <Label htmlFor="antecedentesVisualesFamiliares">Antecedentes Visuales Familiares</Label>
      {antecedentesVisualesFamiliaresError && (
        <p className="text-sm text-red-500">{antecedentesVisualesFamiliaresError}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
        {["Miopía","Hipermetropía","Astigmatismo","Presbicia","Estrabismo","Ambliopía"].map((a) => (
          <div key={a} className="flex items-center space-x-2">
            <Checkbox id={`antecedente-${a}`} checked={antecedentesVisualesFamiliaresSeleccionados.includes(a)} onCheckedChange={(checked) => toggle(!!checked, a)} />
            <Label htmlFor={`antecedente-${a}`} className="font-normal">{a}</Label>
          </div>
        ))}
        <div className="flex items-center space-x-2">
          <Checkbox id="antecedente-ninguno" checked={antecedentesVisualesFamiliaresSeleccionados.includes("Ninguno")} onCheckedChange={(checked) => { if (checked) { setAntecedentesVisualesFamiliaresSeleccionados(["Ninguno"]); setAntecedentesVisualesFamiliaresOtros(""); setAntecedentesVisualesFamiliaresError(null); } else { setAntecedentesVisualesFamiliaresSeleccionados([]); } }} />
          <Label htmlFor="antecedente-ninguno" className="font-normal">Ninguno</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="antecedente-otros" checked={antecedentesVisualesFamiliaresSeleccionados.includes("Otros")} onCheckedChange={(checked) => { if (checked) { if (antecedentesVisualesFamiliaresSeleccionados.includes("Ninguno")) { setAntecedentesVisualesFamiliaresSeleccionados(["Otros"]); } else { setAntecedentesVisualesFamiliaresSeleccionados([...antecedentesVisualesFamiliaresSeleccionados, "Otros"]); } setAntecedentesVisualesFamiliaresError(null); } else { setAntecedentesVisualesFamiliaresSeleccionados(antecedentesVisualesFamiliaresSeleccionados.filter((item) => item !== "Otros")); setAntecedentesVisualesFamiliaresOtros(""); } }} />
          <Label htmlFor="antecedente-otros" className="font-normal">Otros</Label>
        </div>
      </div>
      {antecedentesVisualesFamiliaresSeleccionados.includes("Otros") && (
        <div className="pt-2">
          <Input placeholder="Especifique otros antecedentes visuales familiares" value={antecedentesVisualesFamiliaresOtros} onChange={(e) => { setAntecedentesVisualesFamiliaresOtros(e.target.value); if (!e.target.value.trim()) { setAntecedentesVisualesFamiliaresError("Debe especificar los otros antecedentes"); } else { setAntecedentesVisualesFamiliaresError(null); } }} className="w-full" />
        </div>
      )}
    </div>
  );
}

type AntecedentesSaludProps = {
  antecedentesFamiliaresSaludSeleccionados: string[];
  setAntecedentesFamiliaresSaludSeleccionados: (v: string[]) => void;
};

function AntecedentesSaludSection({ antecedentesFamiliaresSaludSeleccionados, setAntecedentesFamiliaresSaludSeleccionados }: AntecedentesSaludProps) {
  const toggle = (checked: boolean, antecedente: string) => {
    if (checked) {
      if (antecedentesFamiliaresSaludSeleccionados.includes("Ninguno")) {
        setAntecedentesFamiliaresSaludSeleccionados(antecedentesFamiliaresSaludSeleccionados.filter(item => item !== "Ninguno").concat(antecedente));
      } else {
        setAntecedentesFamiliaresSaludSeleccionados([...antecedentesFamiliaresSaludSeleccionados, antecedente]);
      }
    } else {
      setAntecedentesFamiliaresSaludSeleccionados(antecedentesFamiliaresSaludSeleccionados.filter((item) => item !== antecedente));
    }
  };
  return (
    <div className="space-y-2">
      <Label>Antecedentes Familiares de Salud</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-3">
        {["Diabetes","Hipertensión","Enfermedades tiroideas","Glaucoma","Catarata"].map((a) => (
          <div key={a} className="flex items-center space-x-2">
            <Checkbox id={`antecedenteSalud-${a}`} checked={antecedentesFamiliaresSaludSeleccionados.includes(a)} onCheckedChange={(checked) => toggle(!!checked, a)} />
            <Label htmlFor={`antecedenteSalud-${a}`} className="font-normal">{a}</Label>
          </div>
        ))}
        <div className="flex items-center space-x-2">
          <Checkbox id="antecedenteSalud-ninguno" checked={antecedentesFamiliaresSaludSeleccionados.includes("Ninguno")} onCheckedChange={(checked) => { if (checked) { setAntecedentesFamiliaresSaludSeleccionados(["Ninguno"]); } else { setAntecedentesFamiliaresSaludSeleccionados([]); } }} />
          <Label htmlFor="antecedenteSalud-ninguno" className="font-normal">Ninguno</Label>
        </div>
      </div>
    </div>
  );
}

type HabitosProps = {
  habitosVisualesSeleccionados: string[];
  setHabitosVisualesSeleccionados: (v: string[]) => void;
};

function HabitosVisualesSection({ habitosVisualesSeleccionados, setHabitosVisualesSeleccionados }: HabitosProps) {
  const toggle = (checked: boolean, habito: string) => {
    if (checked) setHabitosVisualesSeleccionados([...habitosVisualesSeleccionados, habito]);
    else setHabitosVisualesSeleccionados(habitosVisualesSeleccionados.filter((item) => item !== habito));
  };
  return (
    <div className="space-y-2">
      <Label>Hábitos Visuales</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-3">
        {["Usa computadora o celular más de 6 h al día","Lee con poca luz","Trabaja al aire libre","Expone sus ojos al sol sin protección","Usa lentes de protección en el trabajo"].map((h) => (
          <div key={h} className="flex items-center space-x-2">
            <Checkbox id={`habito-${h}`} checked={habitosVisualesSeleccionados.includes(h)} onCheckedChange={(checked) => toggle(!!checked, h)} />
            <Label htmlFor={`habito-${h}`} className="font-normal">{h}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}

type SaludGeneralProps = {
  saludGeneralSeleccionados: string[];
  setSaludGeneralSeleccionados: (v: string[]) => void;
};

function SaludGeneralSection({ saludGeneralSeleccionados, setSaludGeneralSeleccionados }: SaludGeneralProps) {
  const toggle = (checked: boolean, condicion: string) => {
    if (checked) {
      if (saludGeneralSeleccionados.includes("Ninguno")) {
        setSaludGeneralSeleccionados(saludGeneralSeleccionados.filter(item => item !== "Ninguno").concat(condicion));
      } else {
        setSaludGeneralSeleccionados([...saludGeneralSeleccionados, condicion]);
      }
    } else {
      setSaludGeneralSeleccionados(saludGeneralSeleccionados.filter((item) => item !== condicion));
    }
  };
  return (
    <div className="space-y-2">
      <Label>Salud General</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-3">
        {["Diabetes","Hipertensión","Enfermedades tiroideas","Glaucoma","Catarata"].map((c) => (
          <div key={c} className="flex items-center space-x-2">
            <Checkbox id={`saludGeneral-${c}`} checked={saludGeneralSeleccionados.includes(c)} onCheckedChange={(checked) => toggle(!!checked, c)} />
            <Label htmlFor={`saludGeneral-${c}`} className="font-normal">{c}</Label>
          </div>
        ))}
        <div className="flex items-center space-x-2">
          <Checkbox id="saludGeneral-ninguno" checked={saludGeneralSeleccionados.includes("Ninguno")} onCheckedChange={(checked) => { if (checked) { setSaludGeneralSeleccionados(["Ninguno"]); } else { setSaludGeneralSeleccionados([]); } }} />
          <Label htmlFor="saludGeneral-ninguno" className="font-normal">Ninguno</Label>
        </div>
      </div>
    </div>
  );
}

type MedicamentosFechaProps = {
  medicamentosActuales: string;
  setMedicamentosActuales: (v: string) => void;
  fechaCita: Date | undefined;
  fechaCitaOpen: boolean;
  setFechaCitaOpen: (v: boolean) => void;
  setFechaCita: (d: Date | undefined) => void;
  citasInfo: CitaInfo[];
  cargandoCitas: boolean;
  establecerFechaHoy: () => void;
};

function MedicamentosFechaSection({ medicamentosActuales, setMedicamentosActuales, fechaCita, fechaCitaOpen, setFechaCitaOpen, setFechaCita, citasInfo, cargandoCitas, establecerFechaHoy }: MedicamentosFechaProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="medicamentosActuales">Medicamentos Actuales</Label>
        <Input id="medicamentosActuales" value={medicamentosActuales} onChange={(e) => setMedicamentosActuales(e.target.value)} placeholder="Describa los medicamentos que toma actualmente" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fechaCita">Fecha de Cita</Label>
        <div className="flex space-x-2">
          <Popover open={fechaCitaOpen} onOpenChange={setFechaCitaOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={`w-full justify-start text-left font-normal ${!fechaCita ? "text-muted-foreground" : ""}`}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fechaCita ? format(fechaCita, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <div className="p-2 flex items-center justify-between border-b">
                <div className="flex items-center text-sm"><Users className="h-4 w-4 mr-1" /><span>Pacientes por día</span></div>
                {cargandoCitas && (<div className="text-xs text-muted-foreground">Cargando...</div>)}
              </div>
              <Calendar mode="single" selected={fechaCita} onSelect={(date) => { setFechaCita(date); if (date) setFechaCitaOpen(false); }} initialFocus modifiers={{ booked: (date) => citasInfo.some(cita => isSameDay(date, cita.fecha)) }} modifiersClassNames={{ booked: "relative" }} components={{
                Day: (props: any) => {
                  const date = props.day?.date;
                  const citaDelDia = citasInfo.find(cita => date && isSameDay(date, cita.fecha));
                  return (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <td className="relative">
                            <div {...props} className={props.className} role="button" tabIndex={0}>{props.children}</div>
                            {citaDelDia && (
                              <Badge variant="outline" className="absolute -bottom-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-blue-100">{citaDelDia.cantidadPacientes}</Badge>
                            )}
                          </td>
                        </TooltipTrigger>
                        {citaDelDia && (<TooltipContent><p className="text-xs">{citaDelDia.cantidadPacientes} paciente(s) agendado(s)</p></TooltipContent>)}
                      </Tooltip>
                    </TooltipProvider>
                  );
                }
              }} />
            </PopoverContent>
          </Popover>
          <Button type="button" onClick={establecerFechaHoy} className="flex items-center">Hoy</Button>
        </div>
      </div>
    </div>
  );
}

export default function CrearPacientePage() {
  const router = useRouter();
  const { isOnline, offlineAccepted, syncing, lastSyncAt } = useOffline();
  // Referencias para los inputs
  const nombreRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  // Estado para el usuario actual
  const [userId, setUserId] = useState<string | null>(null);
  const pacientesDB = usePacientesDB({ userId: userId ?? "offline-user", isOnline, offlineAccepted });
  // Estado para las alertas
  const [alertInfo, setAlertInfo] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });
  // Función para mostrar alertas
  const showAlert = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setAlertInfo({
      show: true,
      type,
      title,
      message
    });
    // Ocultar la alerta después de 3 segundos
    setTimeout(() => {
      setAlertInfo(prev => ({ ...prev, show: false }));
    }, 3000);
  };


  // Verificar usuario logueado al cargar el componente
  const supabase = getSupabaseBrowserClient();
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (data?.user?.id) {
          const uid = String(data.user.id);
          setUserId(uid);
          try {
            localStorage.setItem("optisave_user_id", uid);
          } catch {}
          obtenerCitasExistentes(uid);
        } else {
          if (!isOnline) {
            // Recuperar userId del storage para modo offline
            const cached = typeof window !== "undefined" ? localStorage.getItem("optisave_user_id") : null;
            if (cached) {
              setUserId(cached);
              obtenerCitasExistentes(cached);
            }
          }
          if (error) {
            console.error("Error al verificar usuario:", error);
          }
        }
      } catch (e) {
        console.warn("Fallo al obtener usuario; trabajando offline si procede", e);
        const cached = typeof window !== "undefined" ? localStorage.getItem("optisave_user_id") : null;
        if (cached) {
          setUserId(cached);
          obtenerCitasExistentes(cached);
        }
      }
    };
    checkUser();
  }, [isOnline]);

  // Función para obtener las citas existentes
  const obtenerCitasExistentes = async (userId: string) => {
    setCargandoCitas(true);
    try {
      const citasPorFecha = new Map<string, number>();
      if (isOnline) {
        const { data, error } = await supabase
          .from('pacientes' as any)
          .select('fecha_de_cita')
          .eq('user_id', userId)
          .not('fecha_de_cita', 'is', null);
        if (error) {
          console.error("Error al obtener citas:", error);
        } else {
          const pacientes = (data as any[]) || [];
          pacientes.forEach(paciente => {
            if (paciente && paciente.fecha_de_cita) {
              const fecha = String(paciente.fecha_de_cita).split('T')[0];
              citasPorFecha.set(fecha!, (citasPorFecha.get(fecha!) || 0) + 1);
            }
          });
        }
      } else {
        // Offline: contar citas desde DB local
        const locales = await pacientesDB.list();
        locales.forEach(p => {
          if (p && p.fecha_de_cita) {
            const fecha = String(p.fecha_de_cita).split('T')[0];
            if (fecha) {
              citasPorFecha.set(fecha, (citasPorFecha.get(fecha) || 0) + 1);
            }
          }
        });
      }
      const citasInfoArray: CitaInfo[] = Array.from(citasPorFecha.entries()).map(
        ([fechaStr, cantidad]) => ({
          fecha: new Date(fechaStr),
          cantidadPacientes: cantidad,
        }),
      );
      setCitasInfo(citasInfoArray);
    } catch (err) {
      console.error("Error al procesar citas:", err);
    } finally {
      setCargandoCitas(false);
    }
  };

  // Estados para los campos del formulario
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [motivoConsultaOtro, setMotivoConsultaOtro] = useState("");
  const [fechaCita, setFechaCita] = useState<Date | undefined>(undefined);
  const [fechaCitaOpen, setFechaCitaOpen] = useState(false);
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | undefined>(undefined);
  const [fechaNacimientoOpen, setFechaNacimientoOpen] = useState(false);
  const [ocupacion, setOcupacion] = useState("");
  const [sintomasVisuales, setSintomasVisuales] = useState("");
  const [sintomasVisualesSeleccionados, setSintomasVisualesSeleccionados] = useState<string[]>([]);
  const [sintomasVisualesOtro, setSintomasVisualesOtro] = useState("");
  const [ultimoExamenVisual, setUltimoExamenVisual] = useState<string>("");
  const [usaLentes, setUsaLentes] = useState(false);
  const [tipoLentesSeleccionados, setTipoLentesSeleccionados] = useState<string[]>([]);
  const [tiempoUsoLentes, setTiempoUsoLentes] = useState("");
  const [cirugiasOculares, setCirugiasOculares] = useState(false);
  const [traumatismosOculares, setTraumatismosOculares] = useState(false);
  const [traumatismosDetalle, setTraumatismosDetalle] = useState("");
  const [antecedentesVisualesFamiliares, setAntecedentesVisualesFamiliares] = useState("");
  const [antecedentesVisualesFamiliaresSeleccionados, setAntecedentesVisualesFamiliaresSeleccionados] = useState<string[]>([]);
  const [antecedentesVisualesFamiliaresOtros, setAntecedentesVisualesFamiliaresOtros] = useState("");
  const [antecedentesVisualesFamiliaresError, setAntecedentesVisualesFamiliaresError] = useState<string | null>(null);
  const [antecedentesFamiliaresSalud, setAntecedentesFamiliaresSalud] = useState("");
  const [habitosVisuales, setHabitosVisuales] = useState("");
  const [habitosVisualesSeleccionados, setHabitosVisualesSeleccionados] = useState<string[]>([]);
  const [saludGeneral, setSaludGeneral] = useState("");
  const [antecedentesFamiliaresSaludSeleccionados, setAntecedentesFamiliaresSaludSeleccionados] = useState<string[]>([]);
  const [saludGeneralSeleccionados, setSaludGeneralSeleccionados] = useState<string[]>([]);
  const [medicamentosActuales, setMedicamentosActuales] = useState("");

  // Estados para validación
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [telefonoError, setTelefonoError] = useState<string | null>(null);

  // Estado para las citas existentes
  const [citasInfo, setCitasInfo] = useState<CitaInfo[]>([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);

  // Estado para el switch de domicilio
  const [domicilioCompleto, setDomicilioCompleto] = useState(false);
  const [domicilioFields, setDomicilioFields] = useState<DomicilioCompleto>({
    calle: "",
    numero: "",
    interior: "",
    colonia: ""
  });

  // Prefill automático desde el chat (localStorage)
  useEffect(() => {
    const qs = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    if (!qs || qs.get("prefill") !== "1") return;
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("optisave.prefillPaciente") : null;
      if (!raw) return;
      const prefill = JSON.parse(raw || "{}");
      // Limpiar storage tras leer
      localStorage.removeItem("optisave.prefillPaciente");

      // Asignar campos básicos
      if (prefill.nombre) setNombre(String(prefill.nombre));
      if (prefill.telefono) setTelefono(String(prefill.telefono).replace(/\D/g, ""));
      if (prefill.edad !== undefined && prefill.edad !== null) setEdad(String(prefill.edad));
      if (prefill.sexo) setSexo(String(prefill.sexo));
      if (prefill.domicilio) setDomicilio(String(prefill.domicilio));
      if (prefill.motivo_consulta) setMotivoConsulta(String(prefill.motivo_consulta));
      if (prefill.ocupacion) setOcupacion(String(prefill.ocupacion));
      if (prefill.sintomas_visuales) setSintomasVisuales(String(prefill.sintomas_visuales));
      if (prefill.tipos_de_lentes) {
        const tipos = Array.isArray(prefill.tipos_de_lentes)
          ? prefill.tipos_de_lentes
          : String(prefill.tipos_de_lentes).split(",").map((s: string) => s.trim()).filter(Boolean);
        setTipoLentesSeleccionados(tipos);
      }
      if (prefill.tiempo_de_uso_lentes) setTiempoUsoLentes(String(prefill.tiempo_de_uso_lentes));
      if (prefill.cirujias !== undefined) setCirugiasOculares(Boolean(parseTruthy(prefill.cirujias)));
      if (prefill.traumatismos_oculares !== undefined) setTraumatismosOculares(Boolean(parseTruthy(prefill.traumatismos_oculares)));
      if (prefill.nombre_traumatismos_oculares) setTraumatismosDetalle(String(prefill.nombre_traumatismos_oculares));
      if (prefill.antecedentes_visuales_familiares) setAntecedentesVisualesFamiliares(String(prefill.antecedentes_visuales_familiares));
      if (prefill.antecedente_familiar_salud) setAntecedentesFamiliaresSalud(String(prefill.antecedente_familiar_salud));
      if (prefill.habitos_visuales) setHabitosVisuales(String(prefill.habitos_visuales));
      if (prefill.salud_general) setSaludGeneral(String(prefill.salud_general));
      if (prefill.medicamento_actual) setMedicamentosActuales(String(prefill.medicamento_actual));
      if (prefill.uso_lentes !== undefined) setUsaLentes(Boolean(parseTruthy(prefill.uso_lentes)));

      // Fechas (nacimiento y cita)
      if (prefill.fecha_nacimiento) {
        const fn = parseDate(prefill.fecha_nacimiento);
        if (fn) setFechaNacimiento(fn);
      }
      if (prefill.fecha_de_cita) {
        const fcRaw = String(prefill.fecha_de_cita).toLowerCase();
        if (fcRaw === "hoy" || fcRaw === "today" || fcRaw === "ahora") {
          setFechaCita(startOfDay(new Date()));
        } else {
          const fc = parseDate(prefill.fecha_de_cita);
          if (fc) setFechaCita(startOfDay(fc));
        }
      }
    } catch (e) {
      console.warn("No se pudo aplicar prefill del chat:", e);
    }
  }, []);

  // Cargar borrador local del formulario (modo offline)
  useEffect(() => {
    const qs = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    if (!qs || qs.get("draft") !== "1") return;
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("optisave.crearpaciente.draft") : null;
      if (!raw) return;
      const d = JSON.parse(raw || "{}");
      if (d.nombre) setNombre(String(d.nombre));
      if (d.telefono) setTelefono(String(d.telefono));
      if (d.edad) setEdad(String(d.edad));
      if (d.sexo) setSexo(String(d.sexo));
      if (d.domicilio) setDomicilio(String(d.domicilio));
      if (d.motivoConsulta) setMotivoConsulta(String(d.motivoConsulta));
      if (d.motivoConsultaOtro) setMotivoConsultaOtro(String(d.motivoConsultaOtro));
      if (d.fechaCita) {
        const fc = parseDate(d.fechaCita);
        if (fc) setFechaCita(startOfDay(fc));
      }
      if (d.fechaNacimiento) {
        const fn = parseDate(d.fechaNacimiento);
        if (fn) setFechaNacimiento(fn);
      }
      if (d.ocupacion) setOcupacion(String(d.ocupacion));
      if (d.sintomasVisuales) setSintomasVisuales(String(d.sintomasVisuales));
      if (Array.isArray(d.sintomasVisualesSeleccionados)) setSintomasVisualesSeleccionados(d.sintomasVisualesSeleccionados);
      if (d.sintomasVisualesOtro) setSintomasVisualesOtro(String(d.sintomasVisualesOtro));
      if (d.ultimoExamenVisual) setUltimoExamenVisual(String(d.ultimoExamenVisual));
      if (typeof d.usaLentes === "boolean") setUsaLentes(d.usaLentes);
      if (Array.isArray(d.tipoLentesSeleccionados)) setTipoLentesSeleccionados(d.tipoLentesSeleccionados);
      if (d.tiempoUsoLentes) setTiempoUsoLentes(String(d.tiempoUsoLentes));
      if (typeof d.cirugiasOculares === "boolean") setCirugiasOculares(d.cirugiasOculares);
      if (typeof d.traumatismosOculares === "boolean") setTraumatismosOculares(d.traumatismosOculares);
      if (d.traumatismosDetalle) setTraumatismosDetalle(String(d.traumatismosDetalle));
      if (d.antecedentesVisualesFamiliares) setAntecedentesVisualesFamiliares(String(d.antecedentesVisualesFamiliares));
      if (Array.isArray(d.antecedentesVisualesFamiliaresSeleccionados)) setAntecedentesVisualesFamiliaresSeleccionados(d.antecedentesVisualesFamiliaresSeleccionados);
      if (d.antecedentesVisualesFamiliaresOtros) setAntecedentesVisualesFamiliaresOtros(String(d.antecedentesVisualesFamiliaresOtros));
      if (d.antecedentesFamiliaresSalud) setAntecedentesFamiliaresSalud(String(d.antecedentesFamiliaresSalud));
      if (Array.isArray(d.habitosVisualesSeleccionados)) setHabitosVisualesSeleccionados(d.habitosVisualesSeleccionados);
      if (d.habitosVisuales) setHabitosVisuales(String(d.habitosVisuales));
      if (Array.isArray(d.saludGeneralSeleccionados)) setSaludGeneralSeleccionados(d.saludGeneralSeleccionados);
      if (d.saludGeneral) setSaludGeneral(String(d.saludGeneral));
      if (d.medicamentosActuales) setMedicamentosActuales(String(d.medicamentosActuales));
      if (typeof d.domicilioCompleto === "boolean") setDomicilioCompleto(d.domicilioCompleto);
      if (d.domicilioFields) setDomicilioFields(d.domicilioFields);
    } catch (e) {
      console.warn("No se pudo cargar borrador offline:", e);
    }
  }, []);

  // Guardar borrador en localStorage al cambiar campos
  useEffect(() => {
    try {
      const draft = {
        nombre,
        telefono,
        edad,
        sexo,
        domicilio,
        motivoConsulta,
        motivoConsultaOtro,
        fechaCita,
        fechaNacimiento,
        ocupacion,
        sintomasVisuales,
        sintomasVisualesSeleccionados,
        sintomasVisualesOtro,
        ultimoExamenVisual,
        usaLentes,
        tipoLentesSeleccionados,
        tiempoUsoLentes,
        cirugiasOculares,
        traumatismosOculares,
        traumatismosDetalle,
        antecedentesVisualesFamiliares,
        antecedentesVisualesFamiliaresSeleccionados,
        antecedentesVisualesFamiliaresOtros,
        antecedentesFamiliaresSalud,
        habitosVisuales,
        habitosVisualesSeleccionados,
        saludGeneral,
        saludGeneralSeleccionados,
        medicamentosActuales,
        domicilioCompleto,
        domicilioFields,
      };
      localStorage.setItem("optisave.crearpaciente.draft", JSON.stringify(draft));
    } catch (e) {
      // ignore
    }
  }, [
    nombre,
    telefono,
    edad,
    sexo,
    domicilio,
    motivoConsulta,
    motivoConsultaOtro,
    fechaCita,
    fechaNacimiento,
    ocupacion,
    sintomasVisuales,
    sintomasVisualesSeleccionados,
    sintomasVisualesOtro,
    ultimoExamenVisual,
    usaLentes,
    tipoLentesSeleccionados,
    tiempoUsoLentes,
    cirugiasOculares,
    traumatismosOculares,
    traumatismosDetalle,
    antecedentesVisualesFamiliares,
    antecedentesVisualesFamiliaresSeleccionados,
    antecedentesVisualesFamiliaresOtros,
    antecedentesFamiliaresSalud,
    habitosVisuales,
    habitosVisualesSeleccionados,
    saludGeneral,
    saludGeneralSeleccionados,
    medicamentosActuales,
    domicilioCompleto,
    domicilioFields,
  ]);

  function parseTruthy(val: any): boolean {
    if (typeof val === "boolean") return val;
    const s = String(val).trim().toLowerCase();
    return s === "true" || s === "1" || s === "si" || s === "sí" || s === "yes";
  }

  function parseDate(val: any): Date | null {
    try {
      if (val instanceof Date) return val;
      const s = String(val).trim();
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  // Marcar campo como tocado
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
  };

  // Validación de teléfono
  const validateTelefono = (value: string) => {
    if (value && (value.length < 10 || value.length > 10)) {
      return "El teléfono debe tener exactamente 10 dígitos";
    }
    return null;
  };

  // Manejar cambio en el teléfono
  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo permitir dígitos
    setTelefono(value);
    const error = validateTelefono(value);
    setTelefonoError(error);
  };

  // Manejar cambio en los campos de domicilio completo
  const handleDomicilioFieldChange = (field: keyof DomicilioCompleto, value: string) => {
    setDomicilioFields({
      ...domicilioFields,
      [field]: value
    });
  };

  // Validación de formulario
  const isFormValid =
    nombre.trim() !== "" &&
    (telefono === "" || validateTelefono(telefono) === null) &&
    sexo.trim() !== "" &&
    motivoConsulta.trim() !== "" &&
    sintomasVisualesSeleccionados.length > 0 &&
    antecedentesVisualesFamiliaresSeleccionados.length > 0 &&
    antecedentesFamiliaresSaludSeleccionados.length > 0 &&
    habitosVisualesSeleccionados.length > 0 &&
    saludGeneralSeleccionados.length > 0;

  // Función para limpiar el formulario
  const limpiarFormulario = () => {
    setNombre("");
    setTelefono("");
    setEdad("");
    setSexo("");
    setDomicilio("");
    setDomicilioCompleto(false);
    setDomicilioFields({
      calle: "",
      numero: "",
      interior: "",
      colonia: ""
    });
    setMotivoConsulta("");
    setFechaNacimiento(undefined);
    setFechaCita(undefined);
    setFechaNacimientoOpen(false);
    setOcupacion("");
    setSintomasVisuales("");
    setUltimoExamenVisual("");
    setUsaLentes(false);
    setTipoLentesSeleccionados([]);
    setTiempoUsoLentes("");
    setCirugiasOculares(false);
    setTraumatismosOculares(false);
    setTraumatismosDetalle("");
    setAntecedentesVisualesFamiliares("");
    setAntecedentesFamiliaresSalud("");
    setHabitosVisuales("");
    setSaludGeneral("");
    setMedicamentosActuales("");
    setError(null);
    setSuccess(false);
    setTouched({});
    setTelefonoError(null);
  };

  // Función para establecer la fecha actual exacta sin modificaciones
  const establecerFechaHoy = () => {
    // Usamos startOfDay para normalizar la fecha actual sin hora/minutos/segundos
    const fechaHoy = startOfDay(new Date());
    setFechaCita(fechaHoy);
    // Cerramos el popover del calendario para evitar modificaciones manuales
    setFechaCitaOpen(false);
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();

    // Validar campos requeridos
    if (nombre.trim() === "") {
      setError("El nombre es requerido");
      nombreRef.current?.focus();
      return;
    }

    const telefonoErrorMsg = validateTelefono(telefono);
    if (telefono && telefonoErrorMsg) {
      setError(telefonoErrorMsg);
      telefonoRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      // Si estamos offline o no hay usuario, procedemos con inserción local
      if (userError || !user || !isOnline) {
        // Preparar el domicilio según el tipo seleccionado
        let domicilioFinal = domicilio;
        if (domicilioCompleto) {
          domicilioFinal = `${domicilioFields.calle} ${domicilioFields.numero}${domicilioFields.interior ? ', Int. ' + domicilioFields.interior : ''}, Col. ${domicilioFields.colonia}`;
        }

        const hoy = startOfDay(new Date());
        const fc = startOfDay(fechaCita ? new Date(fechaCita) : new Date());
        const estadoCalc = fc.getTime() === hoy.getTime() ? "PENDIENTE" : fc.getTime() > hoy.getTime() ? "PROGRAMADO" : "EXPIRADO";

        await pacientesDB.add({
          nombre,
          edad: edad ? parseInt(edad) : null,
          fecha_nacimiento: fechaNacimiento
            ? format(
                typeof fechaNacimiento === 'string'
                  ? new Date(fechaNacimiento)
                  : fechaNacimiento,
                'yyyy-MM-dd'
              )
            : null,
          sexo,
          domicilio: domicilioFinal,
          motivo_consulta: motivoConsulta === "Otro" ? `Otro: ${motivoConsultaOtro}` : motivoConsulta,
          telefono,
          fecha_de_cita: startOfDay(fechaCita ? new Date(fechaCita) : new Date()).toISOString(),
          estado: estadoCalc,
          diagnostico_id: null,
          ocupacion,
          sintomas_visuales: sintomasVisualesSeleccionados.length > 0
            ? sintomasVisualesSeleccionados.map(s => s === "Otro" ? `Otro: ${sintomasVisualesOtro}` : s).join(", ")
            : sintomasVisuales,
          antecedentes_visuales_familiares: antecedentesVisualesFamiliaresSeleccionados.length > 0
            ? antecedentesVisualesFamiliaresSeleccionados.map(a => a === "Otros" ? `Otros: ${antecedentesVisualesFamiliaresOtros}` : a).join(", ")
            : antecedentesVisualesFamiliares,
          ultimo_examen_visual: ultimoExamenVisual
            ? `${parseInt(ultimoExamenVisual, 10)} ${parseInt(ultimoExamenVisual, 10) === 1 ? 'año' : 'años'}`
            : "",
          uso_lentes: usaLentes,
          tipos_de_lentes: tipoLentesSeleccionados.length > 0 ? tipoLentesSeleccionados.join(", ") : "",
          tiempo_de_uso_lentes: tiempoUsoLentes,
          cirujias: cirugiasOculares,
          traumatismos_oculares: traumatismosOculares,
          nombre_traumatismos_oculares: traumatismosDetalle,
          antecedente_familiar_salud: antecedentesFamiliaresSaludSeleccionados.length > 0
            ? antecedentesFamiliaresSaludSeleccionados.join(", ")
            : antecedentesFamiliaresSalud,
          habitos_visuales: habitosVisualesSeleccionados.length > 0
            ? habitosVisualesSeleccionados.join(", ")
            : habitosVisuales,
          salud_general: saludGeneralSeleccionados.length > 0
            ? saludGeneralSeleccionados.join(", ")
            : saludGeneral,
          medicamento_actual: medicamentosActuales,
        });

        setSuccess(true);
        showAlert('success', 'Paciente guardado offline', 'Se sincronizará automáticamente al recuperar la conexión.');
        limpiarFormulario();
        return; // evitamos continuar con flujo online
      }
      // Preparar el domicilio según el tipo seleccionado
      let domicilioFinal = domicilio;
      if (domicilioCompleto) {
        domicilioFinal = `${domicilioFields.calle} ${domicilioFields.numero}${domicilioFields.interior ? ', Int. ' + domicilioFields.interior : ''}, Col. ${domicilioFields.colonia}`;
      }

      // Insertar en Supabase
      const { data, error: insertError } = await (supabase.from("pacientes" as any) as any)
        .insert([{
          user_id: user.id,
          nombre,
          edad: edad ? parseInt(edad) : null,
          fecha_nacimiento: fechaNacimiento
            ? format(
                typeof fechaNacimiento === 'string'
                  ? new Date(fechaNacimiento)
                  : fechaNacimiento,
                'yyyy-MM-dd'
              )
            : null,
          sexo,
          domicilio: domicilioFinal,
          motivo_consulta: motivoConsulta === "Otro" ? `Otro: ${motivoConsultaOtro}` : motivoConsulta,
          telefono,
          fecha_de_cita: startOfDay(fechaCita ? new Date(fechaCita) : new Date()).toISOString(),
          estado: (() => {
            const hoy = startOfDay(new Date());
            const fc = startOfDay(fechaCita ? fechaCita : new Date());
            if (fc.getTime() === hoy.getTime()) return "PENDIENTE";
            if (fc.getTime() > hoy.getTime()) return "PROGRAMADO";
            return "EXPIRADO";
          })(),
          ocupacion,
          sintomas_visuales: sintomasVisualesSeleccionados.length > 0
            ? sintomasVisualesSeleccionados.map(s => s === "Otro" ? `Otro: ${sintomasVisualesOtro}` : s).join(", ")
            : sintomasVisuales,
          antecedentes_visuales_familiares: antecedentesVisualesFamiliaresSeleccionados.length > 0
            ? antecedentesVisualesFamiliaresSeleccionados.map(a => a === "Otros" ? `Otros: ${antecedentesVisualesFamiliaresOtros}` : a).join(", ")
            : antecedentesVisualesFamiliares,
          ultimo_examen_visual: ultimoExamenVisual
            ? `${parseInt(ultimoExamenVisual, 10)} ${parseInt(ultimoExamenVisual, 10) === 1 ? 'año' : 'años'}`
            : "",
          uso_lentes: usaLentes,
          tipos_de_lentes: tipoLentesSeleccionados.length > 0 ? tipoLentesSeleccionados.join(", ") : "",
          tiempo_de_uso_lentes: tiempoUsoLentes,
          cirujias: cirugiasOculares,
          traumatismos_oculares: traumatismosOculares,
          nombre_traumatismos_oculares: traumatismosDetalle,
          // Duplicate key removed; antecedentes_visuales_familiares is already set above
          antecedente_familiar_salud: antecedentesFamiliaresSaludSeleccionados.length > 0
            ? antecedentesFamiliaresSaludSeleccionados.join(", ")
            : antecedentesFamiliaresSalud,
          habitos_visuales: habitosVisualesSeleccionados.length > 0
            ? habitosVisualesSeleccionados.join(", ")
            : habitosVisuales,
          salud_general: saludGeneralSeleccionados.length > 0
            ? saludGeneralSeleccionados.join(", ")
            : saludGeneral,
          medicamento_actual: medicamentosActuales
        }]);

      if (insertError) {
        console.error("Error insertando paciente:", insertError);
        setError("No se pudo crear el paciente");
        return;
      }
      // Normalizar la fecha de cita usando startOfDay para garantizar consistencia
      const fechaCitaObj = startOfDay(fechaCita ? new Date(fechaCita) : new Date());
      // Mostrar mensaje de éxito
      setSuccess(true);

      if (isSameDay(fechaCitaObj, FECHA_HOY)) {
        showAlert('success', 'Paciente creado exitosamente', 'La cita es para hoy. Redirigiendo al historial clínico...');
      } else {
        showAlert('success', 'Paciente creado exitosamente', 'La cita no es para hoy. Redirigiendo a la página principal...');
      }

      setTimeout(() => {
        router.push('/home/redireccion-paciente');
      }, 2000);

    } catch (err) {
      console.error("Error al crear paciente:", err);
      setError("Ocurrió un error al crear el paciente. Por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirigir automáticamente tras sincronizar si se creó offline
  useEffect(() => {
    if (success && isOnline && lastSyncAt) {
      router.push('/home/redireccion-paciente');
    }
  }, [success, isOnline, lastSyncAt]);

  // Indicadores visuales de estado offline
  const OfflineIndicators = () => (
    <div className="flex items-center gap-2 mb-4">
      {!isOnline && <Badge variant="destructive">Offline</Badge>}
      {syncing && <Badge>Sincronizando…</Badge>}
      {lastSyncAt && <Badge variant="secondary">Última sync: {format(new Date(lastSyncAt), 'HH:mm')}</Badge>}
    </div>
  );

   const rellenarFormularioTest = () => {
      // Datos personales
      setNombre("Paciente de Prueba");
      setTelefono("5512345678");
      setEdad("35");
      setSexo("Masculino");
      setDomicilio("Calle de Prueba 123");
      setOcupacion("Desarrollador");
      const hoy = startOfDay(new Date());
      const fechaNac = new Date();
      fechaNac.setFullYear(fechaNac.getFullYear() - 35); // 35 años atrás
      setFechaNacimiento(fechaNac);
      setFechaCita(hoy);
      setUltimoExamenVisual("1");
      setMotivoConsulta("Revisión rutinaria");
      setSintomasVisualesSeleccionados(["Visión borrosa", "Fatiga visual"]);
      setUsaLentes(true);
      setTipoLentesSeleccionados(["Monofocales"]);
      setTiempoUsoLentes("5 años");
      setCirugiasOculares(false);
      setTraumatismosOculares(false);
      setAntecedentesVisualesFamiliaresSeleccionados(["Miopía"]);
      setAntecedentesFamiliaresSaludSeleccionados(["Hipertensión"]);
      setHabitosVisualesSeleccionados(["Uso de computadora"]);
      setSaludGeneralSeleccionados(["Buena salud general"]);
      setMedicamentosActuales("Ninguno");
    };

  return (
    <>
      <HomeLayoutPageHeader
         title={<Trans i18nKey={'common:routes.home'} />}
         description={<><Trans i18nKey={'common:homeTabDescription'} /> <AppBreadcrumbs /></>}
      />
      <PageBody>
        <div className="container mx-auto px-4 sm:px-6 py-6 pr-[120px]">
      <OfflineIndicators />
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Crear Nuevo Paciente</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 flex items-center text-sm sm:text-base">
          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 flex items-center text-sm sm:text-base">
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              <span className="break-words">Paciente creado exitosamente. {fechaCita && FECHA_HOY.getTime() === startOfDay(new Date(fechaCita)).getTime()
                ? "La cita es para hoy. Redirigiendo al historial clínico..."
            : "La cita no es para hoy. Redirigiendo a la página principal..."}</span>
        </div>
          )}
          {/** <Button onClick={rellenarFormularioTest}>
            Rellenar Formulario de Prueba
          </Button> **/}

      <Card className="shadow-md">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">Información del Paciente</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" autoComplete="off">
                <DatosPersonalesSection
                  nombre={nombre}
                  setNombre={setNombre}
                  touched={touched}
                  handleBlur={handleBlur}
                  fechaNacimientoOpen={fechaNacimientoOpen}
                  setFechaNacimientoOpen={setFechaNacimientoOpen}
                  fechaNacimiento={fechaNacimiento}
                  setFechaNacimiento={setFechaNacimiento}
                  edad={edad}
                  setEdad={setEdad}
                  telefono={telefono}
                  handleTelefonoChange={handleTelefonoChange}
                  telefonoError={telefonoError}
                  sexo={sexo}
                  setSexo={setSexo}
                  nombreRef={nombreRef}
                  telefonoRef={telefonoRef}
                />

                <DomicilioSection
                  domicilioCompleto={domicilioCompleto}
                  setDomicilioCompleto={setDomicilioCompleto}
                  domicilio={domicilio}
                  setDomicilio={setDomicilio}
                  domicilioFields={domicilioFields}
                  handleDomicilioFieldChange={handleDomicilioFieldChange}
                />

                <MotivoConsultaSection
                  motivoConsulta={motivoConsulta}
                  setMotivoConsulta={setMotivoConsulta}
                  motivoConsultaOtro={motivoConsultaOtro}
                  setMotivoConsultaOtro={setMotivoConsultaOtro}
                />

                <OcupacionExamenSection
                  ocupacion={ocupacion}
                  setOcupacion={setOcupacion}
                  ultimoExamenVisual={ultimoExamenVisual}
                  setUltimoExamenVisual={setUltimoExamenVisual}
                />

                <SintomasVisualesSection
                  sintomasVisualesSeleccionados={sintomasVisualesSeleccionados}
                  setSintomasVisualesSeleccionados={setSintomasVisualesSeleccionados}
                  sintomasVisualesOtro={sintomasVisualesOtro}
                  setSintomasVisualesOtro={setSintomasVisualesOtro}
                />

                <LentesSection
                  usaLentes={usaLentes}
                  setUsaLentes={setUsaLentes}
                  tipoLentesSeleccionados={tipoLentesSeleccionados}
                  setTipoLentesSeleccionados={setTipoLentesSeleccionados}
                  tiempoUsoLentes={tiempoUsoLentes}
                  setTiempoUsoLentes={setTiempoUsoLentes}
                />

                <CirugiasTraumatismosSection
                  cirugiasOculares={cirugiasOculares}
                  setCirugiasOculares={setCirugiasOculares}
                  traumatismosOculares={traumatismosOculares}
                  setTraumatismosOculares={setTraumatismosOculares}
                  traumatismosDetalle={traumatismosDetalle}
                  setTraumatismosDetalle={setTraumatismosDetalle}
                />

                <AntecedentesVisualesSection
                  antecedentesVisualesFamiliaresSeleccionados={antecedentesVisualesFamiliaresSeleccionados}
                  setAntecedentesVisualesFamiliaresSeleccionados={setAntecedentesVisualesFamiliaresSeleccionados}
                  antecedentesVisualesFamiliaresOtros={antecedentesVisualesFamiliaresOtros}
                  setAntecedentesVisualesFamiliaresOtros={setAntecedentesVisualesFamiliaresOtros}
                  antecedentesVisualesFamiliaresError={antecedentesVisualesFamiliaresError}
                  setAntecedentesVisualesFamiliaresError={setAntecedentesVisualesFamiliaresError}
                />

                <AntecedentesSaludSection
                  antecedentesFamiliaresSaludSeleccionados={antecedentesFamiliaresSaludSeleccionados}
                  setAntecedentesFamiliaresSaludSeleccionados={setAntecedentesFamiliaresSaludSeleccionados}
                />

                <HabitosVisualesSection
                  habitosVisualesSeleccionados={habitosVisualesSeleccionados}
                  setHabitosVisualesSeleccionados={setHabitosVisualesSeleccionados}
                />

                <SaludGeneralSection
                  saludGeneralSeleccionados={saludGeneralSeleccionados}
                  setSaludGeneralSeleccionados={setSaludGeneralSeleccionados}
                />

                <MedicamentosFechaSection
                  medicamentosActuales={medicamentosActuales}
                  setMedicamentosActuales={setMedicamentosActuales}
                  fechaCita={fechaCita}
                  fechaCitaOpen={fechaCitaOpen}
                  setFechaCitaOpen={setFechaCitaOpen}
                  setFechaCita={setFechaCita}
                  citasInfo={citasInfo}
                  cargandoCitas={cargandoCitas}
                  establecerFechaHoy={establecerFechaHoy}
                />

            <div className="fixed bottom-0 left-0 right-0 md:left-[var(--sidebar-width)] md:right-auto md:w-[calc(100vw-var(--sidebar-width))] bg-white shadow-lg px-4 py-4 pr-[25px] z-[900]">
              <div className="max-w-7xl mx-auto flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={limpiarFormulario}
                  disabled={isSubmitting}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Limpiar datos
                </Button>

                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="bg-primary text-white"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Guardar paciente
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
        </div>
      </PageBody>
    </>
  );
}