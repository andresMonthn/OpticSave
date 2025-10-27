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
import { Copy, Check, AlertCircle, ZoomIn, ZoomOut } from "lucide-react";
import { Trans } from '@kit/ui/trans';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs";

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
        // Aseguramos que la URL tenga el formato correcto para redirección automática
        // Usamos https:// explícitamente para garantizar que los lectores QR reconozcan la URL como enlace
        const generatedUrl = `https://opticsave.vercel.app/public/registro-paciente?user_id=${data.user.id}&redirect=true`;
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
                  <Tabs defaultValue="300" className="w-full">
                    <div className="flex justify-center mb-4">
                      <TabsList>
                        <TabsTrigger value="200" className="flex items-center gap-1">
                          <ZoomOut className="h-3 w-3" />
                          <span>200px</span>
                        </TabsTrigger>
                        <TabsTrigger value="300" className="flex items-center gap-1">
                          <span>300px</span>
                        </TabsTrigger>
                        <TabsTrigger value="500" className="flex items-center gap-1">
                          <ZoomIn className="h-3 w-3" />
                          <span>500px</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <TabsContent value="200" className="flex justify-center">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <QRCodeSVG
                          value={qrUrl}
                          size={200}
                          bgColor={"#ffffff"}
                          fgColor={"#000000"}
                          level={"H"}
                          includeMargin={true}
                          imageSettings={{
                            src: "/images/favicon/logo1.png",
                            x: undefined,
                            y: undefined,
                            height: 40,
                            width: 40,
                            excavate: true,
                          }}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="300" className="flex justify-center">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <QRCodeSVG
                          value={qrUrl}
                          size={300}
                          bgColor={"#ffffff"}
                          fgColor={"#000000"}
                          level={"H"}
                          includeMargin={true}
                          imageSettings={{
                            src: "/images/favicon/logo1.png",
                            x: undefined,
                            y: undefined,
                            height: 60,
                            width: 60,
                            excavate: true,
                          }}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="500" className="flex justify-center">
                      <div className="bg-white p-4 rounded-lg shadow-sm overflow-auto max-w-full">
                        <QRCodeSVG
                          value={qrUrl}
                          size={500}
                          bgColor={"#ffffff"}
                          fgColor={"#000000"}
                          level={"H"}
                          includeMargin={true}
                          imageSettings={{
                            src: "/images/favicon/logo1.png",
                            x: undefined,
                            y: undefined,
                            height: 100,
                            width: 100,
                            excavate: true,
                          }}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="w-full">
                    <div className="text-sm text-[#808080] dark:text-[#808080] mb-2">URL para compartir:</div>
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-100 p-2 rounded text-sm flex-1 overflow-x-auto whitespace-nowrap text-[#808080] dark:text-[#808080]">
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
                    <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                      <p className="text-sm text-blue-700 font-medium mb-1">Instrucciones para escanear:</p>
                      <ol className="text-xs text-blue-600 list-decimal pl-4 space-y-1">
                        <li>Escanea el código QR con la cámara de tu dispositivo</li>
                        <li>Si no se abre automáticamente, toca el enlace que aparece</li>
                        <li>Serás dirigido al formulario de registro de pacientes</li>
                      </ol>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-center space-y-3">
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => window.open(qrUrl, '_blank')}
              >
                Abrir enlace de registro
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Este código QR con logo central permite a los pacientes registrarse directamente sin necesidad de iniciar sesión
              </p>
            </CardFooter>
          </Card>
        </div>
      </PageBody>
    </>
  );
}