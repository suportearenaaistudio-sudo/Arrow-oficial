import { toast } from 'sonner';

export function useNotification() {
  const showSuccess = (message: string) => {
    toast.success(message, {
      duration: 3000,
      style: {
        background: '#ecfdf5',
        border: '1px solid #a7f3d0',
        color: '#065f46',
      },
    });
  };

  const showError = (message: string) => {
    toast.error(message, {
      duration: 4000,
      style: {
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#991b1b',
      },
    });
  };

  const showWarning = (message: string) => {
    toast.warning(message, {
      duration: 3500,
      style: {
        background: '#fffbeb',
        border: '1px solid #fde68a',
        color: '#92400e',
      },
    });
  };

  const showInfo = (message: string) => {
    toast.info(message, {
      duration: 3000,
      style: {
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1e40af',
      },
    });
  };

  return { showSuccess, showError, showWarning, showInfo };
}
