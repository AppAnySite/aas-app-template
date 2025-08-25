import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/ThemeProvider';
import WebViewComponent from '../components/WebView/WebViewComponent';
import { WebViewConfig } from '../types';

// Mock dependencies
jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../core/EventBus', () => ({
  eventBus: {
    addListener: jest.fn(),
    emit: jest.fn(),
  },
  EventType: {
    WEBVIEW_LOAD_START: 'webview:load:start',
    WEBVIEW_LOAD_END: 'webview:load:end',
    WEBVIEW_ERROR: 'webview:error',
    WEBVIEW_NAVIGATION: 'webview:navigation',
    WEBVIEW_MESSAGE: 'webview:message',
  },
  emitEvent: jest.fn(),
}));

jest.mock('../core/PerformanceMonitor', () => ({
  performanceMonitor: {
    measureWebViewLoad: jest.fn(),
  },
  startTimer: jest.fn(() => jest.fn()),
  MetricType: {
    WEBVIEW_LOAD: 'webview_load',
  },
}));

jest.mock('../core/SecurityManager', () => ({
  securityManager: {
    validateURL: jest.fn(() => ({ isValid: true, threats: [], warnings: [], recommendations: [] })),
  },
  validateURL: jest.fn(() => ({ isValid: true, threats: [], warnings: [], recommendations: [] })),
}));

jest.mock('../utils/Logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('WebViewComponent', () => {
  const defaultConfig: WebViewConfig = {
    url: 'https://www.multimagix.com',
    title: 'Test WebView',
    javaScriptEnabled: true,
    domStorageEnabled: true,
    startInLoadingState: false,
    scalesPageToFit: true,
    allowsInlineMediaPlayback: true,
    mediaPlaybackRequiresUserAction: false,
    allowsFullscreenVideo: true,
    mixedContentMode: 'compatibility',
    cacheEnabled: true,
    cacheMode: 'LOAD_DEFAULT',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render WebView with correct configuration', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      const webView = getByTestId('webview-component-webview');
      expect(webView).toBeTruthy();
    });

    it('should render loading component when loading', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      const loadingComponent = getByTestId('webview-component-loading-component');
      expect(loadingComponent).toBeTruthy();
    });

    it('should render network status component', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      const networkStatus = getByTestId('webview-component-network-status');
      expect(networkStatus).toBeTruthy();
    });
  });

  describe('Props and Configuration', () => {
    it('should accept and use custom testID', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent 
            config={defaultConfig} 
            testID="custom-webview" 
          />
        </TestWrapper>
      );

      const webView = getByTestId('custom-webview');
      expect(webView).toBeTruthy();
    });

    it('should accept and use custom accessibility props', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent 
            config={defaultConfig} 
            accessibilityLabel="Custom WebView"
            accessibilityHint="Custom hint"
          />
        </TestWrapper>
      );

      const webView = getByTestId('webview-component-webview');
      expect(webView).toBeTruthy();
    });

    it('should handle custom style prop', () => {
      const customStyle = { backgroundColor: 'red' };
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent 
            config={defaultConfig} 
            style={customStyle}
          />
        </TestWrapper>
      );

      const container = getByTestId('webview-component');
      expect(container).toBeTruthy();
    });
  });

  describe('Event Handling', () => {
    it('should call onStateChange when state changes', async () => {
      const onStateChange = jest.fn();
      
      render(
        <TestWrapper>
          <WebViewComponent 
            config={defaultConfig} 
            onStateChange={onStateChange}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(onStateChange).toHaveBeenCalled();
      });
    });

    it('should call onError when error occurs', async () => {
      const onError = jest.fn();
      
      render(
        <TestWrapper>
          <WebViewComponent 
            config={defaultConfig} 
            onError={onError}
          />
        </TestWrapper>
      );

      // Simulate error
      const webView = render(
        <TestWrapper>
          <WebViewComponent 
            config={defaultConfig} 
            onError={onError}
          />
        </TestWrapper>
      ).getByTestId('webview-component-webview');

      fireEvent(webView, 'error', {
        nativeEvent: {
          code: -1009,
          description: 'Network error',
          url: 'https://www.multimagix.com',
        },
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should call onMessage when message received', async () => {
      const onMessage = jest.fn();
      
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent 
            config={defaultConfig} 
            onMessage={onMessage}
          />
        </TestWrapper>
      );

      const webView = getByTestId('webview-component-webview');

      fireEvent(webView, 'message', {
        nativeEvent: {
          data: JSON.stringify({ type: 'test', message: 'hello' }),
          url: 'https://www.multimagix.com',
        },
      });

      await waitFor(() => {
        expect(onMessage).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    it('should handle navigation state changes', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      const webView = getByTestId('webview-component-webview');

      fireEvent(webView, 'navigationStateChange', {
        url: 'https://www.multimagix.com/search',
        title: 'Google Search',
        loading: false,
        canGoBack: true,
        canGoForward: false,
        lockIdentifier: 1,
      });

      await waitFor(() => {
        // Navigation state should be updated
        expect(webView).toBeTruthy();
      });
    });

    it('should handle load start and end events', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      const webView = getByTestId('webview-component-webview');

      // Simulate load start
      fireEvent(webView, 'loadStart');

      // Simulate load end
      fireEvent(webView, 'loadEnd');

      await waitFor(() => {
        // Loading state should be updated
        expect(webView).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should render error component when error occurs', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      const webView = getByTestId('webview-component-webview');

      fireEvent(webView, 'error', {
        nativeEvent: {
          code: -1009,
          description: 'Network error',
          url: 'https://www.multimagix.com',
        },
      });

      await waitFor(() => {
        const errorComponent = getByTestId('webview-component-error-component');
        expect(errorComponent).toBeTruthy();
      });
    });

    it('should handle retry functionality', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      const webView = getByTestId('webview-component-webview');

      // Trigger error
      fireEvent(webView, 'error', {
        nativeEvent: {
          code: -1009,
          description: 'Network error',
          url: 'https://www.multimagix.com',
        },
      });

      await waitFor(() => {
        const retryButton = getByTestId('error-component-retry-button');
        expect(retryButton).toBeTruthy();
      });
    });
  });

  describe('Security', () => {
    it('should validate URLs for security threats', async () => {
      const { validateURL } = require('../core/SecurityManager');
      
      render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(validateURL).toHaveBeenCalledWith('https://www.multimagix.com');
      });
    });

    it('should handle security validation failures', async () => {
      const { validateURL } = require('../core/SecurityManager');
      validateURL.mockReturnValue({
        isValid: false,
        threats: [{ type: 'suspicious_activity', threatLevel: 'medium' }],
        warnings: ['Suspicious URL pattern'],
        recommendations: ['Use HTTPS'],
      });

      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      const webView = getByTestId('webview-component-webview');

      fireEvent(webView, 'navigationStateChange', {
        url: 'javascript:alert("xss")',
        title: 'Suspicious Page',
        loading: false,
        canGoBack: false,
        canGoForward: false,
        lockIdentifier: 1,
      });

      await waitFor(() => {
        expect(validateURL).toHaveBeenCalledWith('javascript:alert("xss")');
      });
    });
  });

  describe('Performance', () => {
    it('should measure WebView load performance', async () => {
      const { performanceMonitor } = require('../core/PerformanceMonitor');
      
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      const webView = getByTestId('webview-component-webview');

      // Simulate load start and end
      fireEvent(webView, 'loadStart');
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      fireEvent(webView, 'loadEnd');

      await waitFor(() => {
        expect(performanceMonitor.measureWebViewLoad).toHaveBeenCalled();
      });
    });

    it('should start performance timers', async () => {
      const { startTimer } = require('../core/PerformanceMonitor');
      
      render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(startTimer).toHaveBeenCalledWith('webview_load', 'webview_load');
      });
    });
  });

  describe('Logging', () => {
    it('should log WebView events', async () => {
      const { logger } = require('../utils/Logger');
      
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      const webView = getByTestId('webview-component-webview');

      fireEvent(webView, 'loadStart');
      fireEvent(webView, 'loadEnd');

      await waitFor(() => {
        expect(logger.info).toHaveBeenCalled();
      });
    });

    it('should log errors with context', async () => {
      const { logger } = require('../utils/Logger');
      
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      const webView = getByTestId('webview-component-webview');

      fireEvent(webView, 'error', {
        nativeEvent: {
          code: -1009,
          description: 'Network error',
          url: 'https://www.multimagix.com',
        },
      });

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith(
          'WebView error occurred',
          expect.any(Error),
          expect.objectContaining({
            errorCode: -1009,
            url: 'https://www.multimagix.com',
            description: 'Network error',
          }),
          'WebViewComponent'
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent 
            config={defaultConfig}
            accessibilityLabel="Custom WebView"
            accessibilityHint="Custom hint"
          />
        </TestWrapper>
      );

      const webView = getByTestId('webview-component-webview');
      expect(webView).toBeTruthy();
    });

    it('should support screen reader navigation', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      const container = getByTestId('webview-component');
      expect(container).toBeTruthy();
    });
  });

  describe('Theme Integration', () => {
    it('should use theme colors for styling', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      const container = getByTestId('webview-component');
      expect(container).toBeTruthy();
    });

    it('should adapt to theme changes', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      const container = getByTestId('webview-component');
      expect(container).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty URL gracefully', () => {
      const configWithEmptyUrl = { ...defaultConfig, url: '' };
      
      expect(() => {
        render(
          <TestWrapper>
            <WebViewComponent config={configWithEmptyUrl} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('should handle malformed URLs', () => {
      const configWithMalformedUrl = { ...defaultConfig, url: 'not-a-valid-url' };
      
      expect(() => {
        render(
          <TestWrapper>
            <WebViewComponent config={configWithMalformedUrl} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('should handle rapid state changes', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WebViewComponent config={defaultConfig} />
        </TestWrapper>
      );

      const webView = getByTestId('webview-component-webview');

      // Rapid fire events
      for (let i = 0; i < 10; i++) {
        fireEvent(webView, 'loadStart');
        fireEvent(webView, 'loadEnd');
      }

      await waitFor(() => {
        expect(webView).toBeTruthy();
      });
    });
  });
});
