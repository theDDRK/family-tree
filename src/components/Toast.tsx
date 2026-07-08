import React, { useState, useEffect } from 'react';

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
}

// Global emitter helper
export const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message, type } 
    }));
};

export const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const handleShowToast = (e: Event) => {
            const customEvent = e as CustomEvent<{ message: string; type: ToastMessage['type'] }>;
            const { message, type } = customEvent.detail;
            
            const newToast: ToastMessage = {
                id: Math.random().toString(36).substring(2, 9),
                message,
                type
            };

            setToasts(prev => [...prev, newToast]);

            // Auto-remove toast after 3 seconds
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== newToast.id));
            }, 3000);
        };

        window.addEventListener('show-toast', handleShowToast);
        return () => window.removeEventListener('show-toast', handleShowToast);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 999999,
            pointerEvents: 'none' // Click-through
        }}>
            {toasts.map(toast => {
                let bgColor = 'var(--card-bg)';
                let borderColor = 'var(--border-color)';
                let textColor = 'var(--text-primary)';
                
                if (toast.type === 'success') {
                    bgColor = 'rgba(16, 185, 129, 0.12)';
                    borderColor = 'rgba(16, 185, 129, 0.3)';
                    textColor = '#059669';
                }

                return (
                    <div 
                        key={toast.id}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '24px',
                            backgroundColor: bgColor,
                            border: `1px solid ${borderColor}`,
                            color: textColor,
                            fontSize: '13px',
                            fontWeight: '700',
                            boxShadow: 'var(--shadow-lg)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            animation: 'slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
                            pointerEvents: 'auto'
                        }}
                    >
                        <span>{toast.type === 'success' ? '✓' : 'ℹ'}</span>
                        <span>{toast.message}</span>
                        
                        <style>{`
                            @keyframes slideUpFade {
                                from { opacity: 0; transform: translateY(12px) scale(0.95); }
                                to { opacity: 1; transform: translateY(0) scale(1); }
                            }
                        `}</style>
                    </div>
                );
            })}
        </div>
    );
};
