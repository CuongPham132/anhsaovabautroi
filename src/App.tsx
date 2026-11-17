import React, { Component, type ReactNode, useEffect } from 'react';
import { SkyExperiencePage } from './pages/SkyExperiencePage';
import { useSkyStore } from './store/useSkyStore';
import {
  detectDeviceCapabilities,
  determineInitialQualityTier,
} from './services/devicePerfService';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SkyErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[SkyErrorBoundary] Caught unhandled error:', error, errorInfo);
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100%',
            height: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#030511',
            color: '#f4f6ff',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '3rem', marginBottom: '16px' }}>🌌</span>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.4rem' }}>
            Bầu trời đang tạm nghỉ ngơi
          </h2>
          <p
            style={{
              margin: '0 0 20px 0',
              fontSize: '0.9rem',
              color: '#a6b5da',
              maxWidth: '400px',
            }}
          >
            Đã có một lỗi nhỏ xảy ra khi vẽ bầu trời sao. Bạn hãy thử tải lại trang nhé.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="glass-button"
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '0.9rem',
              borderColor: 'var(--star-gold)',
            }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function App(): React.JSX.Element {
  useEffect(() => {
    // Detect hardware tier upon mount and set initial adaptive quality
    const capabilities = detectDeviceCapabilities();
    const tier = determineInitialQualityTier(capabilities);
    useSkyStore.getState().setQualityTier(tier);
  }, []);

  return (
    <SkyErrorBoundary>
      <SkyExperiencePage />
    </SkyErrorBoundary>
  );
}

export default App;
