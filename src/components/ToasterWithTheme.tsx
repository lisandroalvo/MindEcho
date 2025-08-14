import { useTheme } from '../hooks/useTheme';
import { Toaster } from 'sonner';

export function ToasterWithTheme() {
  const { theme } = useTheme();
  
  return (
    <Toaster 
      toastOptions={{
        style: theme === 'light' ? {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          color: '#2d3748',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          fontWeight: '500',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        } : {
          background: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(20px)',
          color: '#f1f5f9',
          border: '1px solid rgba(51, 65, 85, 0.5)',
          borderRadius: '16px',
          fontWeight: '500',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }
      }}
    />
  );
}
