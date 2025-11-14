import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';

export type AlertBannerProps = {
  show: boolean;
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
};

/**
 * Componente UI autocontenido para mostrar alertas.
 */
export function AlertBanner({ show, type, title, message }: AlertBannerProps) {
  if (!show) return null;
  return (
    <Alert
      className="mb-4"
      variant={
        type === 'success' ? 'default' : type === 'error' ? 'destructive' : 'default'
      }
    >
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}