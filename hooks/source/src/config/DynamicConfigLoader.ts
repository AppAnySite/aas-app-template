import { logger } from '../utils/Logger';

/**
 * App configuration interface matching app-config.json structure
 */
export interface AppConfigJson {
  app: {
    name: string;
    version: string;
    buildNumber: string;
    environment: 'development' | 'staging' | 'production';
    bundleId: string;
    displayName: string;
  };
  webView: {
    url: string;
    title: string;
    userAgent: string;
    javaScriptEnabled: boolean;
    domStorageEnabled: boolean;
    startInLoadingState: boolean;
    scalesPageToFit: boolean;
    allowsInlineMediaPlayback: boolean;
    mediaPlaybackRequiresUserAction: boolean;
    allowsFullscreenVideo: boolean;
    mixedContentMode: 'never' | 'always' | 'compatibility';
    cacheEnabled: boolean;
    cacheMode: 'LOAD_DEFAULT' | 'LOAD_NO_CACHE' | 'LOAD_CACHE_ELSE_NETWORK' | 'LOAD_CACHE_ONLY';
    allowFileAccess: boolean;
    allowUniversalAccessFromFileURLs: boolean;
    allowFileAccessFromFileURLs: boolean;
    pullToRefreshEnabled: boolean;
    timeout: number;
    retryAttempts: number;
    offlineMessage: string;
  };
  theme: {
    defaultMode: 'light' | 'dark' | 'system';
    light: {
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
    };
    dark: {
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
    };
  };
  features: {
    analytics: {
      enabled: boolean;
      trackingId: string;
      sessionTimeout: number;
    };
    crashReporting: {
      enabled: boolean;
      serviceUrl: string;
      maxReportsPerSession: number;
    };
    pushNotifications: {
      enabled: boolean;
      fcmSenderId: string;
      defaultChannel: string;
    };
    security: {
      enabled: boolean;
      blockedDomains: string[];
      allowedDomains: string[];
      httpsEnforcement: boolean;
      certificatePinning: boolean;
    };
    performance: {
      monitoring: boolean;
      metrics: {
        renderTime: { warning: number; critical: number };
        networkRequest: { warning: number; critical: number };
        webViewLoad: { warning: number; critical: number };
        memoryUsage: { warning: number; critical: number };
      };
    };
    deepLinking: {
      enabled: boolean;
      scheme: string;
      allowedDomains: string[];
      redirectToBrowser: boolean;
      customScheme?: string;
      universalLinks?: {
        enabled: boolean;
        domains: string[];
      };
    };
    offline: {
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
    };
    lazyLoading: {
      enabled: boolean;
      strategy: 'progressive' | 'skeleton' | 'minimal' | 'custom';
      skeletonConfig: {
        enabled: boolean;
        backgroundColor: string;
        shimmerColor: string;
        animationDuration: number;
        showPlaceholder: boolean;
      };
      progressiveConfig: {
        enabled: boolean;
        preloadImages: boolean;
        preloadScripts: boolean;
        preloadStyles: boolean;
        priorityOrder: string[];
      };
      cacheConfig: {
        enabled: boolean;
        maxCacheSize: number;
        cacheExpiry: number;
        offlineSupport: boolean;
      };
      animationConfig: {
        type: 'fade' | 'slide' | 'scale' | 'custom';
        duration: number;
        easing: string;
        delay: number;
      };
      customLoadingStates: {
        initial: string;
        loading: string;
        error: string;
        success: string;
      };
    };
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    endpoints: {
      config: string;
      analytics: string;
      errors: string;
    };
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    enabled: boolean;
    maxLogs: number;
    remoteReporting: {
      enabled: boolean;
      endpoint: string;
      batchSize: number;
      interval: number;
    };
  };
  network: {
    timeout: number;
    retryAttempts: number;
    offlineDetection: boolean;
    connectionTypes: string[];
  };
  ui: {
    loading: {
      showSpinner: boolean;
      text: string;
      color: string;
    };
    error: {
      showRetryButton: boolean;
      showGoBackButton: boolean;
      customMessages: {
        network: string;
        timeout: string;
        server: string;
      };
    };
    debug: {
      enabled: boolean;
      showControls: boolean;
      logLevel: string;
    };
    watermark: {
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
    };
  };
  metadata: {
    generatedAt: string;
    generatedBy: string;
    version: string;
    checksum: string;
  };
}

/**
 * Dynamic configuration loader that reads from app-config.json
 */
class DynamicConfigLoader {
  private static instance: DynamicConfigLoader;
  private config: AppConfigJson | null = null;
  private configPath: string = 'app-config.json';
  private lastModified: number = 0;
  private configCache: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): DynamicConfigLoader {
    if (!DynamicConfigLoader.instance) {
      DynamicConfigLoader.instance = new DynamicConfigLoader();
    }
    return DynamicConfigLoader.instance;
  }

  /**
   * Load configuration from app-config.json
   */
  public async loadConfig(): Promise<AppConfigJson> {
    try {
      // In React Native, we need to use a different approach to read local files
      // For now, we'll use a require statement, but in production you might want
      // to use react-native-fs or similar for dynamic file reading
      
      // Try to load the config file
      const configModule = require('../../app-config.json');
      
      if (configModule) {
        this.config = configModule as AppConfigJson;
        this.lastModified = Date.now();
        
        // Validate the configuration
        this.validateConfig(this.config);
        
        // Cache the configuration
        this.cacheConfig();
        
        logger.info('Configuration loaded successfully', {
          appName: this.config.app.name,
          version: this.config.app.version,
          environment: this.config.app.environment,
          webViewUrl: this.config.webView.url,
        }, 'DynamicConfigLoader');
        
        return this.config;
      } else {
        throw new Error('Failed to load configuration file');
      }
    } catch (error) {
      logger.error('Failed to load configuration', error as Error, null, 'DynamicConfigLoader');
      
      // Return default configuration if loading fails
      return this.getDefaultConfig();
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): AppConfigJson | null {
    return this.config;
  }

  /**
   * Get WebView configuration
   */
  public getWebViewConfig() {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config.webView;
  }

  /**
   * Get theme configuration
   */
  public getThemeConfig() {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config.theme;
  }

  /**
   * Get features configuration
   */
  public getFeaturesConfig() {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config.features;
  }

  /**
   * Get API configuration
   */
  public getApiConfig() {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config.api;
  }

  /**
   * Get logging configuration
   */
  public getLoggingConfig() {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config.logging;
  }

  /**
   * Get UI configuration
   */
  public getUiConfig() {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config.ui;
  }

  /**
   * Check if configuration needs to be reloaded
   */
  public async shouldReloadConfig(): Promise<boolean> {
    // In a real implementation, you would check if the file has been modified
    // For now, we'll return false to use cached configuration
    return false;
  }

  /**
   * Reload configuration if needed
   */
  public async reloadConfigIfNeeded(): Promise<AppConfigJson> {
    if (await this.shouldReloadConfig()) {
      logger.info('Reloading configuration', null, 'DynamicConfigLoader');
      return await this.loadConfig();
    }
    return this.config!;
  }

  /**
   * Validate configuration structure
   */
  private validateConfig(config: AppConfigJson): void {
    const requiredFields = [
      'app.name',
      'app.version',
      'app.environment',
      'webView.url',
      'webView.title',
      'theme.defaultMode',
    ];

    for (const field of requiredFields) {
      const value = this.getNestedValue(config, field);
      if (!value) {
        throw new Error(`Missing required configuration field: ${field}`);
      }
    }

    // Validate URL format
    try {
      new URL(config.webView.url);
    } catch {
      throw new Error('Invalid WebView URL in configuration');
    }

    // Validate theme mode
    const validThemeModes = ['light', 'dark', 'system'];
    if (!validThemeModes.includes(config.theme.defaultMode)) {
      throw new Error(`Invalid theme mode: ${config.theme.defaultMode}`);
    }

    logger.info('Configuration validation passed', null, 'DynamicConfigLoader');
  }

  /**
   * Get nested object value by path
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Cache configuration for performance
   */
  private cacheConfig(): void {
    if (!this.config) return;

    this.configCache.set('webView', this.config.webView);
    this.configCache.set('theme', this.config.theme);
    this.configCache.set('features', this.config.features);
    this.configCache.set('api', this.config.api);
    this.configCache.set('logging', this.config.logging);
    this.configCache.set('ui', this.config.ui);
  }

  /**
   * Get cached configuration
   */
  public getCachedConfig(key: string): any {
    return this.configCache.get(key);
  }

  /**
   * Get default configuration (fallback)
   */
  private getDefaultConfig(): AppConfigJson {
    return {
      app: {
        name: 'MultiMagix',
        version: '1.0.0',
        buildNumber: '1',
        environment: 'production',
        bundleId: 'com.maigha.multimagix',
        displayName: 'MultiMagix WebView App',
      },
      webView: {
        url: 'https://www.multimagix.com',
        title: 'MultiMagix',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
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
        allowFileAccess: false,
        allowUniversalAccessFromFileURLs: false,
        allowFileAccessFromFileURLs: false,
        pullToRefreshEnabled: true,
        timeout: 30000,
        retryAttempts: 3,
        offlineMessage: 'No internet connection. Please check your network settings.',
      },
      theme: {
        defaultMode: 'system',
        light: {
          colors: {
            primary: '#007AFF',
            secondary: '#5856D6',
            background: '#FFFFFF',
            surface: '#F2F2F7',
            error: '#FF3B30',
            warning: '#FF9500',
            success: '#34C759',
            text: {
              primary: '#000000',
              secondary: '#8E8E93',
              disabled: '#C7C7CC',
            },
            border: '#C6C6C8',
            divider: '#C6C6C8',
          },
        },
        dark: {
          colors: {
            primary: '#0A84FF',
            secondary: '#5E5CE6',
            background: '#000000',
            surface: '#1C1C1E',
            error: '#FF453A',
            warning: '#FF9F0A',
            success: '#30D158',
            text: {
              primary: '#FFFFFF',
              secondary: '#8E8E93',
              disabled: '#3A3A3C',
            },
            border: '#38383A',
            divider: '#38383A',
          },
        },
      },
      features: {
        analytics: {
          enabled: true,
          trackingId: 'default-tracking-id',
          sessionTimeout: 1800000,
        },
        crashReporting: {
          enabled: true,
          serviceUrl: 'https://crash-reporting.example.com',
          maxReportsPerSession: 10,
        },
        pushNotifications: {
          enabled: false,
          fcmSenderId: 'default-fcm-sender-id',
          defaultChannel: 'general',
        },
        security: {
          enabled: true,
          blockedDomains: [],
          allowedDomains: [],
          httpsEnforcement: true,
          certificatePinning: false,
        },
        performance: {
          monitoring: true,
          metrics: {
            renderTime: { warning: 16, critical: 33 },
            networkRequest: { warning: 2000, critical: 5000 },
            webViewLoad: { warning: 3000, critical: 8000 },
            memoryUsage: { warning: 200, critical: 500 },
          },
        },
        deepLinking: {
          enabled: true,
          scheme: 'multimagix',
          allowedDomains: ['multimagix.com', '*.multimagix.com'],
          redirectToBrowser: true,
          customScheme: 'multimagix',
          universalLinks: {
            enabled: false,
            domains: ['https://yoursite.com'],
          },
        },
        offline: {
          enabled: true,
          indicator: {
            enabled: true,
            position: 'top',
            style: 'banner',
            autoHide: true,
            hideDelay: 3000,
          },
          sync: {
            enabled: true,
            autoSync: true,
            syncInterval: 30000,
            maxRetries: 3,
          },
          storage: {
            enabled: true,
            maxSize: 1000,
            cleanupInterval: 3600000,
          },
        },
        lazyLoading: {
          enabled: true,
          strategy: 'progressive',
          skeletonConfig: {
            enabled: true,
            backgroundColor: '#F8F9FA',
            shimmerColor: '#007AFF',
            animationDuration: 1500,
            showPlaceholder: true,
          },
          progressiveConfig: {
            enabled: true,
            preloadImages: true,
            preloadScripts: true,
            preloadStyles: true,
            priorityOrder: ['html', 'css', 'js', 'images'],
          },
          cacheConfig: {
            enabled: true,
            maxCacheSize: 100,
            cacheExpiry: 3600000,
            offlineSupport: true,
          },
          animationConfig: {
            type: 'fade',
            duration: 300,
            easing: 'ease-in-out',
            delay: 0,
          },
          customLoadingStates: {
            initial: 'Preparing to load...',
            loading: 'Loading content...',
            error: 'Failed to load content',
            success: 'Content loaded successfully',
          },
        },
      },
      api: {
        baseUrl: 'https://api.example.com',
        timeout: 10000,
        retryAttempts: 3,
        endpoints: {
          config: '/api/config',
          analytics: '/api/analytics',
          errors: '/api/errors',
        },
      },
      logging: {
        level: 'info',
        enabled: true,
        maxLogs: 1000,
        remoteReporting: {
          enabled: true,
          endpoint: 'https://logs.example.com',
          batchSize: 50,
          interval: 30000,
        },
      },
      network: {
        timeout: 30000,
        retryAttempts: 3,
        offlineDetection: true,
        connectionTypes: ['wifi', 'cellular'],
      },
      ui: {
        loading: {
          showSpinner: true,
          text: 'Loading website...',
          color: '#007AFF',
        },
        error: {
          showRetryButton: true,
          showGoBackButton: true,
          customMessages: {
            network: 'No internet connection. Please check your network settings.',
            timeout: 'Request timed out. Please try again.',
            server: 'Server error. Please try again later.',
          },
        },
              debug: {
        enabled: false,
        showControls: false,
        logLevel: 'warn',
      },
              watermark: {
          enabled: true,
          text: 'Generated by AppAnySite',
          subtext: 'Professional WebView App Builder',
          position: 'bottom-right',
          opacity: 0.7,
          color: '#007AFF',
          fontSize: 14,
          subtextFontSize: 12,
          padding: 20,
          cornerRadius: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          showInScreenshots: true,
          showInProduction: true,
          showInDevelopment: true,
        },
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'default-config',
        version: '1.0.0',
        checksum: 'default-checksum',
      },
    };
  }

  /**
   * Export current configuration
   */
  public exportConfig(): string {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Get configuration metadata
   */
  public getConfigMetadata() {
    if (!this.config) {
      return null;
    }
    return this.config.metadata;
  }
}

// Export singleton instance
export const dynamicConfigLoader = DynamicConfigLoader.getInstance();

// Export convenience functions
export const loadAppConfig = () => dynamicConfigLoader.loadConfig();
export const getWebViewConfig = () => dynamicConfigLoader.getWebViewConfig();
export const getThemeConfig = () => dynamicConfigLoader.getThemeConfig();
export const getFeaturesConfig = () => dynamicConfigLoader.getFeaturesConfig();
export const getApiConfig = () => dynamicConfigLoader.getApiConfig();
export const getLoggingConfig = () => dynamicConfigLoader.getLoggingConfig();
export const getUiConfig = () => dynamicConfigLoader.getUiConfig();
export const getLazyLoadingConfig = () => dynamicConfigLoader.getFeaturesConfig()?.lazyLoading;
export const getDeepLinkingConfig = () => dynamicConfigLoader.getFeaturesConfig()?.deepLinking;
export const getOfflineConfig = () => dynamicConfigLoader.getFeaturesConfig()?.offline;
