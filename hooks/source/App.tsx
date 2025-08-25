/**
 * MultiMagix WebView App
 * A React Native app that displays a website in a WebView
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  LogBox,
  AppState,
  AppStateStatus,
  Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { AppConfiguration } from './src/config/AppConfig';
import { dynamicConfigLoader } from './src/config/DynamicConfigLoader';
import WebViewComponent from './src/components/WebView/WebViewComponent';
import { useTheme } from './src/theme/ThemeProvider';
import { WebViewState, WebViewError, WebViewMessage } from './src/types';

// Ignore specific warnings in development
if (__DEV__) {
  LogBox.ignoreLogs([
    'Require cycle:',
    'ViewPropTypes will be removed',
    'AsyncStorage has been extracted',
  ]);
}

/**
 * Main application component
 * Provides theme context and manages app lifecycle
 */
const AppContent: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [webViewState, setWebViewState] = useState<WebViewState>({
    isLoading: true,
    canGoBack: false,
    canGoForward: false,
    currentUrl: '',
    title: '',
    navigationHistory: [],
  });

  // Get configuration
  const config = AppConfiguration.getWebViewConfig();
  
  // Load dynamic configuration
  useEffect(() => {
    const loadDynamicConfig = async () => {
      try {
        await dynamicConfigLoader.loadConfig();
        console.log('Dynamic configuration loaded successfully');
      } catch (error) {
        console.error('Failed to load dynamic configuration:', error);
      }
    };

    loadDynamicConfig();
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state changed:', { from: appState, to: nextAppState });
      
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        console.log('App resumed');
        // Could implement analytics tracking here
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background
        console.log('App backgrounded');
        // Could implement cleanup or analytics tracking here
      }
      
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState]);

  // Handle WebView state changes
  const handleWebViewStateChange = (state: WebViewState) => {
    setWebViewState(state);
    console.log('WebView state changed:', {
      url: state.currentUrl,
      title: state.title,
      canGoBack: state.canGoBack,
      canGoForward: state.canGoForward,
    });
  };

  // Handle WebView errors
  const handleWebViewError = (error: WebViewError) => {
    console.error('WebView error in App:', error);
    // Could implement error reporting here
  };

  // Handle WebView messages
  const handleWebViewMessage = (message: WebViewMessage) => {
    console.log('WebView message in App:', message);
    // Could implement message handling logic here
  };

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      
      <WebViewComponent
        config={config}
        onStateChange={handleWebViewStateChange}
        onError={handleWebViewError}
        onMessage={handleWebViewMessage}
        testID="main-webview"
        accessibilityLabel="Main web content"
        accessibilityHint="Displays the main website content"
      />
    </>
  );
};

/**
 * Root application component
 * Wraps the app with necessary providers
 */
const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Validate configuration
        if (!AppConfiguration.validateConfig()) {
          console.error('Invalid app configuration');
          return;
        }

        // Log app initialization
        const config = AppConfiguration.getConfig();
        console.log('App initialized:', {
          name: config.name,
          version: config.version,
          environment: config.environment,
          webViewUrl: config.webViewUrl,
        });

        // Simulate initialization delay
        await new Promise<void>(resolve => setTimeout(resolve, 100));
        
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsReady(true); // Still set ready to show error state
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    // Could show a splash screen here
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider initialTheme="system">
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
