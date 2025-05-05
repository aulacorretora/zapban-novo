import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { socket } from '@/lib/socket';
import { toast } from '@/components/ui/use-toast';

type QRCodeScannerProps = {
  instanceId: string;
  onConnected?: () => void;
};

export function QRCodeScanner({ instanceId, onConnected }: QRCodeScannerProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'connected' | 'error' | 'timeout' | 'expired'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastGeneratedTime, setLastGeneratedTime] = useState<number>(0);
  const qrTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const MIN_RETRY_INTERVAL = 8000; // 8 seconds
  const MAX_RETRY_INTERVAL = 15000; // 15 seconds
  const QR_EXPIRATION_TIME = 60000; // 60 seconds
  const MAX_RECONNECT_ATTEMPTS = 5; // Maximum number of reconnection attempts

  const getRandomRetryInterval = () => {
    return Math.floor(Math.random() * (MAX_RETRY_INTERVAL - MIN_RETRY_INTERVAL + 1)) + MIN_RETRY_INTERVAL;
  };

  const fetchQRCode = async () => {
    try {
      if (isGenerating) {
        console.log('QR code generation already in progress, skipping request');
        return;
      }

      const now = Date.now();
      const timeSinceLastGeneration = now - lastGeneratedTime;
      
      if (timeSinceLastGeneration < MIN_RETRY_INTERVAL && lastGeneratedTime > 0) {
        const waitTime = MIN_RETRY_INTERVAL - timeSinceLastGeneration;
        console.log(`Too soon to generate another QR code. Waiting ${waitTime}ms before trying again`);
        
        toast({
          title: "Aguarde um momento",
          description: `Tentando novamente em ${Math.ceil(waitTime/1000)} segundos...`,
          variant: "default",
        });
        
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchQRCode();
        }, waitTime);
        
        return;
      }
      
      setIsGenerating(true);
      setStatus('loading');
      setError(null);
      
      const rawUserId = localStorage.getItem('userId') || '';
      const userId = rawUserId === 'dev-user-id' ? '00000000-0000-0000-0000-000000000000' : rawUserId;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/instances/${instanceId}/qr`, {
        headers: {
          'Content-Type': 'application/json',
          'userId': userId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', response.status, errorData);
        throw new Error(errorData.error || 'Falha ao gerar QR code');
      }

      setLastGeneratedTime(Date.now());
      console.log('QR code request successful, waiting for socket event');
      
      if (qrTimeoutRef.current) {
        clearTimeout(qrTimeoutRef.current);
      }
      
      qrTimeoutRef.current = setTimeout(() => {
        if (status !== 'connected') {
          console.log('QR code scanning timed out');
          setStatus('expired');
          setQrCode(null);
          setIsGenerating(false);
        }
      }, QR_EXPIRATION_TIME);
      
    } catch (err: any) {
      console.error('QR code fetch error:', err);
      setStatus('error');
      setError(err.message || 'Falha ao gerar QR code');
      setIsGenerating(false);
      
      toast({
        title: "Erro ao gerar QR Code",
        description: err.message || 'Falha ao gerar QR code. Tente novamente.',
        variant: "destructive",
      });
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const rawUserId = localStorage.getItem('userId') || '';
      const userId = rawUserId === 'dev-user-id' ? '00000000-0000-0000-0000-000000000000' : rawUserId;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/instances/${instanceId}/status`, {
        headers: {
          'Content-Type': 'application/json',
          'userId': userId,
        },
      });

      if (!response.ok) {
        console.error('Error checking connection status:', response.status);
        return;
      }

      const data = await response.json();
      console.log(`Initial connection status for instance ${instanceId}:`, data.status);
      
      if (data.status === 'connected') {
        console.log(`Instance ${instanceId} is already connected`);
        setStatus('connected');
        setError(null);
        onConnected?.();
      } else if (data.status === 'connecting' || data.status === 'reconnecting') {
        setStatus('loading');
      } else {
        setStatus('idle');
      }
    } catch (err) {
      console.error('Error checking connection status:', err);
    }
  };

  useEffect(() => {
    if (!instanceId) return;

    socket.emit('join_instance', instanceId);
    
    checkConnectionStatus();
    
    if (status !== 'connected') {
      fetchQRCode();
    }

    const handleQRCode = (data: { instanceId: string; qr: string }) => {
      try {
        if (data.instanceId === instanceId) {
          console.log('Received QR code for instance:', instanceId);
          
          if (!data.qr) {
            console.error('QR code data is missing or invalid');
            setStatus('error');
            setError('Dados do QR code inválidos ou ausentes');
            setIsGenerating(false);
            return;
          }
          
          setQrCode(data.qr);
          setStatus('idle'); // Change to idle to show the QR code
          setIsGenerating(false);
          
          if (qrTimeoutRef.current) {
            clearTimeout(qrTimeoutRef.current);
          }
          
          qrTimeoutRef.current = setTimeout(() => {
            if (status !== 'connected') {
              console.log('QR code scanning timed out');
              setStatus('expired');
              setQrCode(null);
              
              toast({
                title: "QR Code expirado",
                description: "O QR Code expirou. Clique em 'Gerar novo QR Code' para tentar novamente.",
                variant: "default",
              });
            }
          }, QR_EXPIRATION_TIME);
        }
      } catch (err) {
        console.error('Error processing QR code:', err);
        setStatus('error');
        setError('Falha ao processar dados do QR code');
        setIsGenerating(false);
      }
    };

    const handleConnectionStatus = (data: { instanceId: string; status: string; error?: string }) => {
      try {
        if (data.instanceId === instanceId) {
          console.log(`Connection status update for ${instanceId}: ${data.status}`);
          
          if (data.status === 'connected') {
            if (qrTimeoutRef.current) {
              clearTimeout(qrTimeoutRef.current);
              qrTimeoutRef.current = null;
            }
            
            setStatus('connected');
            setError(null);
            reconnectAttempts.current = 0;
            setIsGenerating(false);
            
            toast({
              title: "WhatsApp conectado",
              description: "Seu WhatsApp foi conectado com sucesso!",
              variant: "default",
            });
            
            onConnected?.();
          } else if (data.status === 'disconnected') {
            setStatus('idle');
            setQrCode(null);
            setIsGenerating(false);
            
            if (data.error) {
              setError(data.error);
              console.warn(`Disconnection error: ${data.error}`);
              
              toast({
                title: "WhatsApp desconectado",
                description: data.error || "A conexão com o WhatsApp foi perdida.",
                variant: "destructive",
              });
            }
          } else if (data.status === 'reconnecting') {
            setStatus('loading');
            setError(null);
            
            toast({
              title: "Reconectando",
              description: "Tentando restabelecer a conexão com o WhatsApp...",
              variant: "default",
            });
            
            if (qrTimeoutRef.current) {
              clearTimeout(qrTimeoutRef.current);
            }
            
            const retryInterval = getRandomRetryInterval();
            
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }
            
            retryTimeoutRef.current = setTimeout(() => {
              if (status === 'loading') {
                console.log(`Reconnection taking too long, trying to generate a new QR code in ${retryInterval/1000} seconds`);
                
                toast({
                  title: "Reconexão demorada",
                  description: `Gerando novo QR Code em ${Math.ceil(retryInterval/1000)} segundos...`,
                  variant: "default",
                });
                
                setTimeout(() => {
                  handleRetry();
                }, retryInterval);
              }
            }, 15000); // 15 seconds to try reconnecting before deciding to generate new QR
          } else if (data.status === 'error') {
            setStatus('error');
            setError(data.error || 'Erro de conexão desconhecido');
            setIsGenerating(false);
            console.error(`Connection error: ${data.error || 'Unknown connection error'}`);
            
            toast({
              title: "Erro de conexão",
              description: data.error || "Ocorreu um erro ao conectar com o WhatsApp.",
              variant: "destructive",
            });
          }
        }
      } catch (err) {
        console.error('Error handling connection status:', err);
        setStatus('error');
        setError('Falha ao processar status de conexão');
        setIsGenerating(false);
      }
    };

    socket.on('qr_code', handleQRCode);
    socket.on('connection_status', handleConnectionStatus);

    return () => {
      if (qrTimeoutRef.current) {
        clearTimeout(qrTimeoutRef.current);
        qrTimeoutRef.current = null;
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      socket.off('qr_code', handleQRCode);
      socket.off('connection_status', handleConnectionStatus);
    };
  }, [instanceId, onConnected, status]);

  const handleRetry = () => {
    try {
      if (isGenerating) {
        console.log('QR code generation already in progress, skipping retry');
        
        toast({
          title: "Aguarde",
          description: "Já estamos gerando um novo QR Code...",
          variant: "default",
        });
        
        return;
      }
      
      reconnectAttempts.current += 1;
      
      if (reconnectAttempts.current > MAX_RECONNECT_ATTEMPTS) {
        console.log(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`);
        setStatus('error');
        setError(`Número máximo de tentativas (${MAX_RECONNECT_ATTEMPTS}) atingido. Por favor, tente novamente mais tarde.`);
        setIsGenerating(false);
        
        toast({
          title: "Limite de tentativas atingido",
          description: `Número máximo de tentativas (${MAX_RECONNECT_ATTEMPTS}) atingido. Por favor, tente novamente mais tarde.`,
          variant: "destructive",
        });
        
        return;
      }
      
      setStatus('idle');
      setError(null);
      setQrCode(null);
      
      if (qrTimeoutRef.current) {
        clearTimeout(qrTimeoutRef.current);
        qrTimeoutRef.current = null;
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      console.log(`Attempting to reconnect instance ${instanceId}, attempt #${reconnectAttempts.current} of ${MAX_RECONNECT_ATTEMPTS}`);
      socket.emit('join_instance', instanceId);
      
      fetchQRCode();
    } catch (err) {
      console.error('Unexpected error in handleRetry:', err);
      setStatus('error');
      setError('Ocorreu um erro inesperado. Por favor, tente novamente.');
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Conectar WhatsApp</CardTitle>
        <CardDescription>
          Escaneie o QR code com seu WhatsApp para conectar sua conta
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        {status === 'loading' && !qrCode && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              {isGenerating ? 'Gerando QR code...' : 'Conectando...'}
            </p>
          </div>
        )}

        {qrCode && status !== 'connected' && (
          <div className="flex flex-col items-center justify-center">
            <div className="border-2 border-primary p-2 rounded-md">
              <img
                src={`data:image/png;base64,${qrCode}`}
                alt="WhatsApp QR Code"
                className="w-64 h-64"
              />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Abra o WhatsApp no seu celular, toque em Menu ou Configurações e selecione WhatsApp Web
            </p>
          </div>
        )}

        {status === 'connected' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="mt-4 text-lg font-medium">WhatsApp Conectado!</p>
            <p className="text-sm text-muted-foreground">
              Você já pode enviar e receber mensagens
            </p>
          </div>
        )}

        {status === 'error' && (
          <Alert variant="destructive" className="w-full">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro de Conexão</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {(status === 'timeout' || status === 'expired') && (
          <Alert variant="destructive" className="w-full">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>QR Code Expirado</AlertTitle>
            <AlertDescription>
              O QR code expirou ou o tempo limite foi atingido. Por favor, gere um novo QR code.
            </AlertDescription>
          </Alert>
        )}

        {(status === 'error' || status === 'timeout' || status === 'expired' || (status === 'idle' && !qrCode)) && (
          <Button 
            onClick={handleRetry} 
            className="mt-4"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aguarde...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {reconnectAttempts.current > 0 ? 'Tentar Novamente' : 'Conectar WhatsApp'}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
