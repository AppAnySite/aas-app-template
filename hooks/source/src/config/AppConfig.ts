import { AppConfig, WebViewConfig } from '../types';

/**
 * Environment-based configuration management
 * Provides different settings for development, staging, and production environments
 */
class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Load configuration based on current environment
   */
  private loadConfiguration(): AppConfig {
    const environment = this.getEnvironment();
    
    const baseConfig: AppConfig = {
      name: 'MultiMagix',
      version: '1.0.0',
      buildNumber: '1',
      environment,
      apiBaseUrl: '',
      webViewUrl: 'https://www.multimagix.com',
      enableAnalytics: true,
      enableCrashReporting: true,
      enablePushNotifications: false,
    };

    switch (environment) {
      case 'development':
        return {
          ...baseConfig,
          apiBaseUrl: 'http://localhost:3000/api',
          webViewUrl: 'https://www.multimagix.com',
          enableAnalytics: false,
          enableCrashReporting: false,
        };
      
      case 'staging':
        return {
          ...baseConfig,
          apiBaseUrl: 'https://staging-api.example.com',
          webViewUrl: 'https://staging.example.com',
          enableAnalytics: true,
          enableCrashReporting: true,
        };
      
      case 'production':
        return {
          ...baseConfig,
          apiBaseUrl: 'https://api.example.com',
          webViewUrl: 'https://www.multimagix.com',
          enableAnalytics: true,
          enableCrashReporting: true,
          enablePushNotifications: true,
        };
      
      default:
        return baseConfig;
    }
  }

  /**
   * Get current environment
   */
  private getEnvironment(): 'development' | 'staging' | 'production' {
    if (__DEV__) {
      return 'development';
    }
    
    // In a real app, you might check for staging builds
    // For now, we'll default to production for release builds
    return 'production';
  }

  /**
   * Get current configuration
   */
  public getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get WebView configuration
   */
  public getWebViewConfig(): WebViewConfig {
    return {
      url: this.config.webViewUrl,
      title: this.config.name,
      userAgent: this.getUserAgent(),
      allowFileAccess: false,
      allowUniversalAccessFromFileURLs: false,
      allowFileAccessFromFileURLs: false,
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
      onShouldStartLoadWithRequest: this.handleShouldStartLoadWithRequest.bind(this),
      onNavigationStateChange: this.handleNavigationStateChange.bind(this),
      onError: this.handleWebViewError.bind(this),
      onLoadStart: this.handleLoadStart.bind(this),
      onLoadEnd: this.handleLoadEnd.bind(this),
      onMessage: this.handleWebViewMessage.bind(this),
    };
  }

  /**
   * Get appropriate user agent for the platform
   */
  private getUserAgent(): string {
    const platform = require('react-native').Platform.OS;
    
    if (platform === 'ios') {
      return 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
    } else {
      return 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36';
    }
  }

  /**
   * Handle WebView navigation requests
   */
  private handleShouldStartLoadWithRequest(request: any): boolean {
    // Log navigation for analytics
    console.log('WebView navigation:', request.url);
    
    // Allow all navigation by default
    // You can add custom logic here to block certain URLs or handle deep links
    return true;
  }

  /**
   * Handle WebView navigation state changes
   */
  private handleNavigationStateChange(navState: any): void {
    console.log('WebView navigation state changed:', {
      url: navState.url,
      title: navState.title,
      canGoBack: navState.canGoBack,
      canGoForward: navState.canGoForward,
    });
  }

  /**
   * Handle WebView errors
   */
  private handleWebViewError(error: any): void {
    console.error('WebView error:', error);
    
    // In production, you might want to send this to your error reporting service
    if (this.config.enableCrashReporting) {
      // Send error to crash reporting service
    }
  }

  /**
   * Handle WebView load start
   */
  private handleLoadStart(): void {
    console.log('WebView load started');
  }

  /**
   * Handle WebView load end
   */
  private handleLoadEnd(): void {
    console.log('WebView load ended');
  }

  /**
   * Handle WebView messages
   */
  private handleWebViewMessage(message: any): void {
    console.log('WebView message received:', message);
    
    // Handle messages from the website
    try {
      const data = JSON.parse(message.data);
      this.handleWebViewMessageData(data);
    } catch (error) {
      console.warn('Failed to parse WebView message:', error);
    }
  }

  /**
   * Handle parsed WebView message data
   */
  private handleWebViewMessageData(data: any): void {
    switch (data.type) {
      case 'ANALYTICS':
        if (this.config.enableAnalytics) {
          // Track analytics event
          console.log('Analytics event from WebView:', data.event);
        }
        break;
      
      case 'NAVIGATION':
        // Handle navigation requests from WebView
        console.log('Navigation request from WebView:', data);
        break;
      
      case 'ERROR':
        // Handle error reports from WebView
        console.error('Error from WebView:', data.error);
        break;
      
      default:
        console.log('Unknown WebView message type:', data.type);
    }
  }

  /**
   * Validate configuration
   */
  public validateConfig(): boolean {
    const requiredFields: (keyof AppConfig)[] = [
      'name',
      'version',
      'environment',
      'webViewUrl',
    ];

    for (const field of requiredFields) {
      if (!this.config[field]) {
        console.error(`Missing required configuration field: ${field}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Get configuration for specific feature
   */
  public getFeatureConfig(feature: string): any {
    const featureConfigs: Record<string, any> = {
      analytics: {
        enabled: this.config.enableAnalytics,
        trackingId: 'your-tracking-id',
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
      },
      crashReporting: {
        enabled: this.config.enableCrashReporting,
        serviceUrl: 'https://crash-reporting.example.com',
        maxReportsPerSession: 10,
      },
      pushNotifications: {
        enabled: this.config.enablePushNotifications,
        fcmSenderId: 'your-fcm-sender-id',
        defaultChannel: 'general',
      },
      webView: {
        timeout: 30000, // 30 seconds
        retryAttempts: 3,
        offlineMessage: 'No internet connection. Please check your network settings.',
      },
    };

    return featureConfigs[feature] || {};
  }
}

// Export singleton instance
export const AppConfiguration = ConfigurationManager.getInstance();

// Export default configuration for direct access
export const defaultAppConfig: AppConfig = AppConfiguration.getConfig();
export const defaultWebViewConfig: WebViewConfig = AppConfiguration.getWebViewConfig();
