import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Text,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { 
  WebViewComponentProps, 
  WebViewState, 
  WebViewError, 
  WebViewMessage,
  WebViewRequest,
  NavigationState 
} from '../../types';
import { LoadingComponent } from '../Loading/LoadingComponent';
import { ErrorComponent } from '../Error/ErrorComponent';
import { NetworkStatusComponent } from '../Network/NetworkStatusComponent';
import { WatermarkComponent } from '../Watermark/WatermarkComponent';
import { eventBus, EventType, emitEvent } from '../../core/EventBus';
import { performanceMonitor, startTimer, MetricType } from '../../core/PerformanceMonitor';
import { securityManager, validateURL } from '../../core/SecurityManager';
import { logger } from '../../utils/Logger';
import { dynamicConfigLoader, getWebViewConfig, getUiConfig, getLazyLoadingConfig, getDeepLinkingConfig, getOfflineConfig } from '../../config/DynamicConfigLoader';
import { 
  lazyLoadingManager, 
  initializeLazyLoading, 
  startLazyLoading, 
  getLoadingState, 
  getLoadingProgress,
  LoadingState 
} from '../LazyLoading/LazyLoadingManager';
import { SkeletonLoadingComponent } from '../LazyLoading/SkeletonLoadingComponent';
import { 
  deepLinkManager, 
  initializeDeepLinking, 
  processDeepLink, 
  isDeepLinkingEnabled 
} from '../../core/DeepLinkManager';
import { OfflineIndicator } from '../Offline/OfflineIndicator';
import { 
  offlineStorageManager, 
  initializeOfflineStorage, 
  storeOfflineData 
} from '../../core/OfflineStorageManager';
import { 
  smartSyncManager, 
  initializeSmartSync, 
  performSync 
} from '../../core/SmartSyncManager';

/**
 * Professional WebView component with comprehensive features
 * Handles loading states, errors, navigation, and user interactions
 */
export const WebViewComponent: React.FC<WebViewComponentProps> = ({
  config: propConfig,
  onStateChange,
  onError,
  onMessage,
  testID = 'webview-component',
  accessibilityLabel = 'Web content',
  accessibilityHint = 'Displays web content in a native container',
  style,
}) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  
  // Dynamic configuration state
  const [dynamicConfig, setDynamicConfig] = useState<any>(null);
  const [uiConfig, setUiConfig] = useState<any>(null);
  const [lazyLoadingConfig, setLazyLoadingConfig] = useState<any>(null);
  const [deepLinkingConfig, setDeepLinkingConfig] = useState<any>(null);
  
  // Lazy loading state
  const [lazyLoadingState, setLazyLoadingState] = useState<LoadingState>(LoadingState.INITIAL);
  const [lazyLoadingProgress, setLazyLoadingProgress] = useState<number>(0);
  
  // Deep linking state
  const [isDeepLinkingEnabled, setIsDeepLinkingEnabled] = useState<boolean>(false);
  
  // Offline state
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineConfig, setOfflineConfig] = useState<any>(null);
  
  // Use dynamic config if available, otherwise fall back to prop config
  const config = dynamicConfig || propConfig;
  
  // State management
  const [state, setState] = useState<WebViewState>({
    isLoading: true,
    canGoBack: false,
    canGoForward: false,
    currentUrl: config?.url || 'https://www.multimagix.com',
    title: config?.title || 'MultiMagix',
    navigationHistory: [],
  });
  
  const [error, setError] = useState<WebViewError | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);

  // Load dynamic configuration on component mount
  useEffect(() => {
    const loadDynamicConfig = async () => {
      try {
        await dynamicConfigLoader.loadConfig();
        const webViewConfig = getWebViewConfig();
        const uiConfigData = getUiConfig();
        const lazyLoadingData = getLazyLoadingConfig();
        const deepLinkingData = getDeepLinkingConfig();
        const offlineData = getOfflineConfig();
        
        setDynamicConfig(webViewConfig);
        setUiConfig(uiConfigData);
        setLazyLoadingConfig(lazyLoadingData);
        setDeepLinkingConfig(deepLinkingData);
        setOfflineConfig(offlineData);
        
        // Initialize lazy loading if enabled
        if (lazyLoadingData?.enabled) {
          initializeLazyLoading(lazyLoadingData);
          
          // Set up lazy loading event listeners
          lazyLoadingManager.addEventListener('stateChange', (data: any) => {
            setLazyLoadingState(data.state);
            setLazyLoadingProgress(data.progress);
          });
          
          lazyLoadingManager.addEventListener('progressUpdate', (data: any) => {
            setLazyLoadingProgress(data.progress);
          });
        }
        
        // Initialize deep linking if enabled
        if (deepLinkingData?.enabled) {
          initializeDeepLinking(deepLinkingData);
          setIsDeepLinkingEnabled(true);
        }
        
        // Initialize offline functionality if enabled
        if (offlineData?.enabled) {
          initializeOfflineStorage();
          initializeSmartSync(offlineData);
          
          // Set up offline detection (simplified for React Native)
          // In a real app, you'd use @react-native-community/netinfo
          const checkOfflineStatus = () => {
            // For now, we'll simulate offline detection
            // This would be replaced with actual NetInfo implementation
            setIsOffline(false); // Default to online
          };
          
          // Check initial status
          checkOfflineStatus();
        }
        
        // Update state with new configuration
        updateState({
          currentUrl: webViewConfig.url,
          title: webViewConfig.title,
        });
        
        logger.info('Dynamic configuration loaded successfully', {
          url: webViewConfig.url,
          title: webViewConfig.title,
          watermark: uiConfigData?.watermark,
          lazyLoading: lazyLoadingData?.enabled,
        }, 'WebViewComponent');
      } catch (error) {
        logger.error('Failed to load dynamic configuration', error as Error, null, 'WebViewComponent');
        // Fall back to prop config
      }
    };

    loadDynamicConfig();

    // Cleanup function to remove event listeners
    return () => {
      if (lazyLoadingConfig?.enabled) {
        lazyLoadingManager.removeEventListener('stateChange', () => {});
        lazyLoadingManager.removeEventListener('progressUpdate', () => {});
      }
    };
  }, []);

  // Update state and notify parent
  const updateState = useCallback((updates: Partial<WebViewState>) => {
    const newState = { ...state, ...updates };
    setState(newState);
    onStateChange?.(newState);
  }, [state, onStateChange]);

  // Handle load start
  const handleLoadStart = useCallback(() => {
    const startTime = Date.now();
    setLoadStartTime(startTime);
    updateState({ isLoading: true, error: undefined });
    
    // Start lazy loading if enabled
    if (lazyLoadingConfig?.enabled) {
      startLazyLoading();
    }
    
    // Emit event
    emitEvent(EventType.WEBVIEW_LOAD_START, {
      source: 'WebViewComponent',
      data: { url: config.url, startTime },
    });
    
    // Start performance timer
    const endTimer = startTimer('webview_load', MetricType.WEBVIEW_LOAD);
    
    // Log event
    logger.info('WebView load started', { url: config.url }, 'WebViewComponent');
    
    config.onLoadStart?.();
  }, [updateState, config, lazyLoadingConfig]);

  // Handle load end
  const handleLoadEnd = useCallback(() => {
    const loadTime = loadStartTime ? Date.now() - loadStartTime : 0;
    
    // Record performance metric
    performanceMonitor.measureWebViewLoad(config.url, loadTime);
    
    // Log performance
    logger.info(`WebView loaded in ${loadTime}ms`, { url: config.url, loadTime }, 'WebViewComponent');
    
    updateState({ isLoading: false });
    setLoadStartTime(null);
    
    // Complete lazy loading if enabled
    if (lazyLoadingConfig?.enabled) {
      // Cache the loaded content
      lazyLoadingManager.cacheContent(config.url, { loadedAt: Date.now() });
    }
    
    // Emit event
    emitEvent(EventType.WEBVIEW_LOAD_END, {
      source: 'WebViewComponent',
      data: { url: config.url, loadTime },
    });
    
    config.onLoadEnd?.();
  }, [updateState, loadStartTime, config, lazyLoadingConfig]);

  // Handle errors
  const handleError = useCallback((event: any) => {
    const webViewError: WebViewError = {
      code: event.nativeEvent?.code || -1,
      description: event.nativeEvent?.description || 'Unknown error',
      url: event.nativeEvent?.url || config.url,
    };
    
    // Handle lazy loading error
    if (lazyLoadingConfig?.enabled) {
      lazyLoadingManager.handleError(new Error(webViewError.description));
    }
    
    // Log error with context
    logger.error('WebView error occurred', new Error(webViewError.description), { 
      errorCode: webViewError.code,
      url: webViewError.url,
      description: webViewError.description 
    }, 'WebViewComponent');
    
    updateState({ 
      isLoading: false, 
      error: webViewError 
    });
    setError(webViewError);
    setLoadStartTime(null);
    
    // Emit error event
    emitEvent(EventType.WEBVIEW_ERROR, {
      source: 'WebViewComponent',
      data: webViewError,
    });
    
    // Notify parent
    onError?.(webViewError);
    config.onError?.(webViewError);
    
    // Only show alert for critical errors, not for common issues like timeouts
    if (webViewError.code !== -1001 && webViewError.code !== -1009) {
      Alert.alert(
        'Loading Error',
        'Failed to load the website. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: handleRetry },
          { text: 'Go Back', onPress: handleGoBack, style: 'cancel' },
        ]
      );
    }
  }, [updateState, onError, config, config.url, lazyLoadingConfig]);

  // Handle navigation state changes
  const handleNavigationStateChange = useCallback((navState: NavigationState) => {
    // Process deep linking if enabled
    if (isDeepLinkingEnabled && deepLinkingConfig?.enabled) {
      console.log('🔗 Deep Linking Debug:', {
        url: navState.url,
        isDeepLinkingEnabled,
        deepLinkingConfig: deepLinkingConfig
      });
      
      const deepLinkResult = processDeepLink(navState.url, 'app');
      
      console.log('🔗 Deep Link Result:', deepLinkResult);
      
      if (!deepLinkResult.shouldOpenInApp && deepLinkResult.shouldRedirectToBrowser) {
        // Redirect to browser for external URLs
        logger.info('Redirecting to browser', { url: navState.url, reason: deepLinkResult.reason }, 'WebViewComponent');
        
        console.log('🚫 Should redirect to browser:', navState.url);
        
        // Actually implement browser redirection
        try {
          // Use Linking to open in external browser
          Linking.openURL(navState.url);
          
          // Prevent the WebView from loading this URL
          return false;
        } catch (error) {
          logger.error('Failed to redirect to browser', error as Error, { url: navState.url }, 'WebViewComponent');
        }
        
        return;
      }
    } else {
      console.log('🔗 Deep Linking not enabled or configured');
    }
    
    // Validate URL for security threats
    const securityValidation = validateURL(navState.url);
    if (!securityValidation.isValid) {
      logger.warn('Navigation blocked due to security concerns', securityValidation, 'WebViewComponent');
      // Could implement navigation blocking here
    }
    
    const historyUpdate = [...state.navigationHistory];
    
    // Add current state to history if it's different
    const currentState = {
      url: navState.url,
      title: navState.title,
      loading: navState.loading,
      canGoBack: navState.canGoBack,
      canGoForward: navState.canGoForward,
      lockIdentifier: navState.lockIdentifier,
    };
    
    if (historyUpdate.length === 0 || 
        historyUpdate[historyUpdate.length - 1].url !== currentState.url) {
      historyUpdate.push(currentState);
    }
    
    updateState({
      isLoading: navState.loading,
      canGoBack: navState.canGoBack,
      canGoForward: navState.canGoForward,
      currentUrl: navState.url,
      title: navState.title,
      navigationHistory: historyUpdate.slice(-50), // Keep last 50 entries
    });
    
    // Emit navigation event
    emitEvent(EventType.WEBVIEW_NAVIGATION, {
      source: 'WebViewComponent',
      data: navState,
    });
    
    // Log navigation
    logger.info('WebView navigation state changed', {
      url: navState.url,
      title: navState.title,
      canGoBack: navState.canGoBack,
      canGoForward: navState.canGoForward,
    }, 'WebViewComponent');
    
    config.onNavigationStateChange?.(navState);
  }, [state.navigationHistory, updateState, config, isDeepLinkingEnabled, deepLinkingConfig]);

  // Handle messages from WebView
  const handleMessage = useCallback((event: any) => {
    const message: WebViewMessage = {
      data: event.nativeEvent?.data || '',
      url: event.nativeEvent?.url || config.url,
    };
    
    // Log message
    logger.debug('WebView message received', message, 'WebViewComponent');
    
    // Emit message event
    emitEvent(EventType.WEBVIEW_MESSAGE, {
      source: 'WebViewComponent',
      data: message,
    });
    
    try {
      const data = JSON.parse(message.data);
      onMessage?.(data);
      config.onMessage?.(data);
    } catch (error) {
      logger.warn('Failed to parse WebView message', { error, message }, 'WebViewComponent');
    }
  }, [onMessage, config, config.url]);

  // Navigation methods
  const handleGoBack = useCallback(() => {
    if (state.canGoBack) {
      webViewRef.current?.goBack();
    } else {
      // If can't go back, show exit confirmation
      Alert.alert(
        'Exit App',
        'Are you sure you want to exit the app?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', onPress: () => BackHandler.exitApp(), style: 'destructive' },
        ]
      );
    }
  }, [state.canGoBack]);

  const handleGoForward = useCallback(() => {
    if (state.canGoForward) {
      webViewRef.current?.goForward();
    }
  }, [state.canGoForward]);

  const handleReload = useCallback(() => {
    webViewRef.current?.reload();
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    updateState({ error: undefined });
    webViewRef.current?.reload();
  }, [updateState]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    webViewRef.current?.reload();
  }, []);

  // Handle back button on Android
  useEffect(() => {
    const backAction = () => {
      if (state.canGoBack) {
        handleGoBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [state.canGoBack, handleGoBack]);

  // Auto-retry on network recovery
  useEffect(() => {
    if (error && state.isLoading === false) {
      // Could implement network recovery logic here
      // For now, we'll just log the error state
      console.log('WebView in error state, ready for retry');
    }
  }, [error, state.isLoading]);

  // Styles
  const styles = createStyles(theme, insets);

  // Render error state
  if (error) {
    return (
      <View style={[styles.container, style]} testID={`${testID}-error`}>
        <ErrorComponent
          error={error}
          onRetry={handleRetry}
          onGoBack={handleGoBack}
          showRetryButton={uiConfig?.error?.showRetryButton !== false}
          showGoBackButton={uiConfig?.error?.showGoBackButton !== false}
          customMessages={uiConfig?.error?.customMessages}
          testID={`${testID}-error-component`}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Network Status Indicator */}
      <NetworkStatusComponent testID={`${testID}-network-status`} />
      
      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: config.url }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={config.onShouldStartLoadWithRequest}
        // WebView configuration
        javaScriptEnabled={config.javaScriptEnabled ?? true}
        domStorageEnabled={config.domStorageEnabled ?? true}
        startInLoadingState={false}
        scalesPageToFit={config.scalesPageToFit ?? true}
        allowsInlineMediaPlayback={config.allowsInlineMediaPlayback ?? true}
        mediaPlaybackRequiresUserAction={config.mediaPlaybackRequiresUserAction ?? false}
        allowsFullscreenVideo={config.allowsFullscreenVideo ?? true}
        mixedContentMode={config.mixedContentMode ?? 'compatibility'}
        cacheEnabled={config.cacheEnabled ?? true}
        cacheMode={config.cacheMode ?? 'LOAD_DEFAULT'}
        userAgent={config.userAgent}
        // Security settings
        allowFileAccess={config.allowFileAccess ?? false}
        allowUniversalAccessFromFileURLs={config.allowUniversalAccessFromFileURLs ?? false}
        allowFileAccessFromFileURLs={config.allowFileAccessFromFileURLs ?? false}
        // Additional features
        pullToRefreshEnabled={config.pullToRefreshEnabled ?? true}
        // Accessibility
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={`${testID}-webview`}
      />
      
      {/* Loading overlay with lazy loading support */}
      {state.isLoading && (
        <View style={styles.loadingOverlay} testID={`${testID}-loading`}>
          {/* Show skeleton loading if enabled */}
          {lazyLoadingConfig?.enabled && lazyLoadingState === LoadingState.SKELETON && (
            <SkeletonLoadingComponent
              enabled={lazyLoadingConfig.skeletonConfig?.enabled}
              backgroundColor={lazyLoadingConfig.skeletonConfig?.backgroundColor}
              shimmerColor={lazyLoadingConfig.skeletonConfig?.shimmerColor}
              animationDuration={lazyLoadingConfig.skeletonConfig?.animationDuration}
              testID={`${testID}-skeleton-loading`}
            />
          )}
          
          {/* Show progressive loading if enabled */}
          {lazyLoadingConfig?.enabled && lazyLoadingState === LoadingState.PROGRESSIVE && (
            <LoadingComponent
              size="large"
              color={uiConfig?.loading?.color || theme.colors.primary}
              text={`${lazyLoadingConfig.customLoadingStates?.loading || "Loading content..."} (${lazyLoadingProgress}%)`}
              showSpinner={uiConfig?.loading?.showSpinner !== false}
              testID={`${testID}-progressive-loading`}
            />
          )}
          
          {/* Show cached content indicator */}
          {lazyLoadingConfig?.enabled && lazyLoadingState === LoadingState.CACHED && (
            <LoadingComponent
              size="large"
              color={uiConfig?.loading?.color || theme.colors.primary}
              text={lazyLoadingConfig.customLoadingStates?.success || "Loading from cache..."}
              showSpinner={false}
              testID={`${testID}-cached-loading`}
            />
          )}
          
          {/* Show default loading if lazy loading is disabled or in initial state */}
          {(!lazyLoadingConfig?.enabled || lazyLoadingState === LoadingState.INITIAL || lazyLoadingState === LoadingState.LOADING) && (
            <LoadingComponent
              size="large"
              color={uiConfig?.loading?.color || theme.colors.primary}
              text={uiConfig?.loading?.text || "Loading website..."}
              showSpinner={uiConfig?.loading?.showSpinner !== false}
              testID={`${testID}-loading-component`}
            />
          )}
        </View>
      )}
      
      {/* Debug controls removed - using pull-to-refresh instead */}
      
      {/* Watermark - Always render if config exists */}
      {uiConfig?.watermark && uiConfig.watermark.enabled && (
        <>
          {console.log('Rendering watermark with config:', uiConfig.watermark)}
          <WatermarkComponent
            config={uiConfig.watermark}
            testID={`${testID}-watermark`}
          />
        </>
      )}
      
      {/* Offline Indicator */}
      {offlineConfig?.indicator?.enabled && (
        <OfflineIndicator
          isOffline={isOffline}
          onRetry={() => {
            // Trigger sync when retry is pressed
            if (offlineConfig?.sync?.enabled) {
              performSync();
            }
          }}
          position={offlineConfig.indicator.position}
          style={offlineConfig.indicator.style}
          autoHide={offlineConfig.indicator.autoHide}
          hideDelay={offlineConfig.indicator.hideDelay}
          testID={`${testID}-offline-indicator`}
        />
      )}
    </View>
  );
};

// Styles
const createStyles = (theme: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background + 'E6', // 90% opacity
  },
});

export default WebViewComponent;
