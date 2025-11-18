import { useState } from 'react';

export type AlertType = 'success' | 'error' | 'warning';

export function useAlerts() {
  const [alertInfo, setAlertInfo] = useState<{
    show: boolean;
    type: AlertType;
    title: string;
    message: string;
  }>({ show: false, type: 'success', title: '', message: '' });

  const showAlert = (type: AlertType, title: string, message: string) => {
    setAlertInfo({ show: true, type, title, message });
    setTimeout(() => setAlertInfo((prev) => ({ ...prev, show: false })), 3000);
  };

  return { alertInfo, showAlert };
}