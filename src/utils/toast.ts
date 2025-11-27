// Simple toast utility to replace react-hot-toast
class ToastManager {
  private toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }> = [];
  private listeners: Array<(toasts: any[]) => void> = [];

  private notify(message: string, type: 'success' | 'error' | 'info') {
    const id = Math.random().toString(36).substr(2, 9);
    const toast = { id, message, type };
    
    this.toasts.push(toast);
    this.listeners.forEach(listener => listener([...this.toasts]));

    // Auto remove after 3 seconds
    setTimeout(() => {
      this.remove(id);
    }, 3000);

    return id;
  }

  success(message: string) {
    return this.notify(message, 'success');
  }

  error(message: string) {
    return this.notify(message, 'error');
  }

  info(message: string) {
    return this.notify(message, 'info');
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  subscribe(listener: (toasts: any[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const toast = new ToastManager();
