// Core application types
export interface AppConfig {
  name: string;
  version: string;
  buildNumber: string;
  environment: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  webViewUrl: string;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  enablePushNotifications: boolean;
}

// WebView configuration types
export interface WebViewConfig {
  url: string;
  title: string;
  userAgent?: string;
  allowFileAccess?: boolean;
  allowUniversalAccessFromFileURLs?: boolean;
  allowFileAccessFromFileURLs?: boolean;
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  startInLoadingState?: boolean;
  scalesPageToFit?: boolean;
  allowsInlineMediaPlayback?: boolean;
  mediaPlaybackRequiresUserAction?: boolean;
  allowsFullscreenVideo?: boolean;
  mixedContentMode?: 'never' | 'always' | 'compatibility';
  cacheEnabled?: boolean;
  cacheMode?: 'LOAD_DEFAULT' | 'LOAD_NO_CACHE' | 'LOAD_CACHE_ELSE_NETWORK' | 'LOAD_CACHE_ONLY';
  onShouldStartLoadWithRequest?: (request: WebViewRequest) => boolean;
  onNavigationStateChange?: (navState: NavigationState) => void;
  onError?: (error: WebViewError) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onMessage?: (message: WebViewMessage) => void;
}

export interface WebViewRequest {
  url: string;
  mainDocumentURL?: string;
  navigationType: 'click' | 'formsubmit' | 'backforward' | 'reload' | 'formresubmit' | 'other';
}

export interface NavigationState {
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  lockIdentifier: number;
}

export interface WebViewError {
  code: number;
  description: string;
  url: string;
}

export interface WebViewMessage {
  data: string;
  url: string;
}

// Theme and styling types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    error: string;
    warning: string;
    success: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    border: string;
    divider: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    h4: TextStyle;
    h5: TextStyle;
    h6: TextStyle;
    body1: TextStyle;
    body2: TextStyle;
    caption: TextStyle;
    button: TextStyle;
  };
}

export interface TextStyle {
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

// Analytics and tracking types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

export interface CrashReport {
  error: Error;
  stackTrace: string;
  deviceInfo: DeviceInfo;
  appVersion: string;
  timestamp: number;
  userId?: string;
}

// Device and platform types
export interface DeviceInfo {
  id: string;
  name: string;
  model: string;
  systemName: string;
  systemVersion: string;
  appVersion: string;
  buildNumber: string;
  bundleId: string;
  isTablet: boolean;
  isEmulator: boolean;
  screenWidth: number;
  screenHeight: number;
  screenScale: number;
  totalMemory: number;
  freeMemory: number;
  batteryLevel: number;
  isCharging: boolean;
  networkType: 'wifi' | 'cellular' | 'none';
  carrier?: string;
  timezone: string;
  locale: string;
}

// Network and API types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
  requestId: string;
}

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: 'wifi' | 'cellular' | 'none';
  isExpensive: boolean;
}

// State management types
export interface AppState {
  config: AppConfig;
  theme: Theme;
  device: DeviceInfo;
  network: NetworkState;
  webView: WebViewState;
  analytics: AnalyticsState;
  errors: ErrorState;
}

export interface WebViewState {
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  currentUrl: string;
  title: string;
  error?: WebViewError;
  navigationHistory: NavigationState[];
}

export interface AnalyticsState {
  sessionId: string;
  userId?: string;
  events: AnalyticsEvent[];
  isEnabled: boolean;
}

export interface ErrorState {
  errors: CrashReport[];
  isReportingEnabled: boolean;
}

// Component prop types
export interface BaseComponentProps {
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  style?: any;
  children?: React.ReactNode;
}

export interface WebViewComponentProps extends BaseComponentProps {
  config: WebViewConfig;
  onStateChange?: (state: WebViewState) => void;
  onError?: (error: WebViewError) => void;
  onMessage?: (message: WebViewMessage) => void;
}

export interface LoadingComponentProps extends BaseComponentProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  showSpinner?: boolean;
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  subtext: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  color: string;
  fontSize: number;
  subtextFontSize: number;
  padding: number;
  cornerRadius: number;
  backgroundColor: string;
  showInScreenshots: boolean;
  showInProduction: boolean;
  showInDevelopment: boolean;
}

export interface ErrorComponentProps extends BaseComponentProps {
  error: WebViewError;
  onRetry?: () => void;
  onGoBack?: () => void;
  showRetryButton?: boolean;
  showGoBackButton?: boolean;
  customMessages?: {
    network?: string;
    timeout?: string;
    server?: string;
  };
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Event types
export type AppEvent = 
  | { type: 'APP_INITIALIZED'; payload: AppConfig }
  | { type: 'THEME_CHANGED'; payload: Theme }
  | { type: 'NETWORK_STATE_CHANGED'; payload: NetworkState }
  | { type: 'WEBVIEW_LOAD_START'; payload: { url: string } }
  | { type: 'WEBVIEW_LOAD_END'; payload: { url: string } }
  | { type: 'WEBVIEW_ERROR'; payload: WebViewError }
  | { type: 'WEBVIEW_MESSAGE'; payload: WebViewMessage }
  | { type: 'ANALYTICS_EVENT'; payload: AnalyticsEvent }
  | { type: 'CRASH_REPORTED'; payload: CrashReport };

// Hook return types
export interface UseWebViewReturn {
  state: WebViewState;
  ref: React.RefObject<any>;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  stopLoading: () => void;
  injectJavaScript: (script: string) => void;
  postMessage: (message: string) => void;
}

export interface UseAnalyticsReturn {
  trackEvent: (name: string, properties?: Record<string, any>) => void;
  setUser: (userId: string, properties?: Record<string, any>) => void;
  trackScreen: (screenName: string, properties?: Record<string, any>) => void;
  trackError: (error: Error, properties?: Record<string, any>) => void;
}

export interface UseNetworkReturn {
  state: NetworkState;
  isConnected: boolean;
  isInternetReachable: boolean;
  networkType: string;
}

// Deep Linking Types
export interface DeepLinkConfig {
  enabled: boolean;
  scheme: string;
  allowedDomains: string[];
  redirectToBrowser: boolean;
  customScheme?: string;
  universalLinks?: {
    enabled: boolean;
    domains: string[];
  };
}

export interface DeepLinkData {
  url: string;
  source: 'app' | 'browser' | 'notification' | 'external';
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface DeepLinkResult {
  handled: boolean;
  shouldOpenInApp: boolean;
  shouldRedirectToBrowser: boolean;
  reason: string;
  url: string;
}

// Offline Types
export interface OfflineConfig {
  enabled: boolean;
  indicator: {
    enabled: boolean;
    position: 'top' | 'bottom' | 'floating';
    style: 'banner' | 'toast' | 'badge';
    autoHide: boolean;
    hideDelay: number;
  };
  sync: {
    enabled: boolean;
    autoSync: boolean;
    syncInterval: number;
    maxRetries: number;
  };
  storage: {
    enabled: boolean;
    maxSize: number;
    cleanupInterval: number;
  };
}

export interface OfflineData {
  id: string;
  type: 'page' | 'config' | 'analytics' | 'user_data';
  data: any;
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'failed';
  retryCount: number;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  errors: string[];
  timestamp: number;
}

export interface OfflineAnalytics {
  offlineSessions: number;
  offlineDuration: number;
  cachedPages: number;
  syncAttempts: number;
  syncSuccessRate: number;
  lastSyncTime: number;
}
