"use client";
/// componente creador de qr

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
// @ts-ignore
import { CopyToClipboard } from "react-copy-to-clipboard";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { HomeLayoutPageHeader } from '../../../(user)/_components/home-page-header';
import { PageBody } from '@kit/ui/page';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@kit/ui/card";
import { Button } from "@kit/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@kit/ui/alert";
import { Copy, Check, AlertCircle } from "lucide-react";
import { Trans } from '@kit/ui/trans';

export default function QRGeneratorPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserId = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          throw new Error("No se pudo obtener la información del usuario");
        }
        
        if (!data.user) {
          throw new Error("No hay sesión de usuario activa");
        }
        
        setUserId(data.user.id);
        const generatedUrl = `https://opticsave.vercel.app/public/registro-paciente?account_id=${data.user.id}`;
        setQrUrl(generatedUrl);
      } catch (err: any) {
        setError(err.message || "Error al obtener el ID de usuario");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserId();
  }, []);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <HomeLayoutPageHeader
        title="Generador de Código QR"
        description="Genera un código QR para el registro de pacientes"
      />
      <PageBody>
        <div className="container mx-auto px-4 py-8">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Código QR para Registro de Pacientes</CardTitle>
              <CardDescription>
                Escanea este código QR para acceder al formulario de registro de pacientes
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-6">
              {loading ? (
                <div className="flex items-center justify-center h-64 w-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <QRCodeSVG
                      value={qrUrl}
                      size={250}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"H"}
                      includeMargin={true}
                    />
                  </div>
                  <div className="w-full">
                    <div className="text-sm text-gray-500 mb-2">URL para compartir:</div>
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-100 p-2 rounded text-sm flex-1 overflow-x-auto whitespace-nowrap">
                        {qrUrl}
                      </div>
                      <CopyToClipboard text={qrUrl} onCopy={handleCopy}>
                        <Button variant="outline" size="icon" className="flex-shrink-0">
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </CopyToClipboard>
                    </div>
                    {copied && (
                      <p className="text-xs text-green-600 mt-1">¡URL copiada al portapapeles!</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-xs text-gray-500 text-center">
                Este código QR permite a los pacientes registrarse directamente sin necesidad de iniciar sesión
              </p>
            </CardFooter>
          </Card>
        </div>
      </PageBody>
    </>
  );
}