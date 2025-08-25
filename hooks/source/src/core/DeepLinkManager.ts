import { DeepLinkConfig, DeepLinkData, DeepLinkResult } from '../types';
import { logger } from '../utils/Logger';
import { eventBus, EventType, emitEvent } from './EventBus';
import { performanceMonitor, MetricType } from './PerformanceMonitor';

/**
 * DeepLinkManager - Handles deep linking and URL routing
 * Manages which URLs open in the app vs browser
 */
class DeepLinkManager {
  private static instance: DeepLinkManager;
  private config: DeepLinkConfig | null = null;
  private isInitialized = false;
  private linkHistory: DeepLinkData[] = [];

  private constructor() {}

  static getInstance(): DeepLinkManager {
    if (!DeepLinkManager.instance) {
      DeepLinkManager.instance = new DeepLinkManager();
    }
    return DeepLinkManager.instance;
  }

  /**
   * Initialize the deep linking manager
   */
  initialize(config: DeepLinkConfig): void {
    this.config = config;
    this.isInitialized = true;
    
    logger.info('DeepLinkManager initialized', {
      enabled: config.enabled,
      scheme: config.scheme,
      allowedDomains: config.allowedDomains,
    }, 'DeepLinkManager');

    emitEvent(EventType.DEEP_LINK_INITIALIZED, {
      source: 'DeepLinkManager',
      data: config,
    });
  }

  /**
   * Process a URL and determine if it should open in app or browser
   */
  processURL(url: string, source: DeepLinkData['source'] = 'external'): DeepLinkResult {
    if (!this.isInitialized || !this.config?.enabled) {
      return {
        handled: false,
        shouldOpenInApp: false,
        shouldRedirectToBrowser: true,
        reason: 'Deep linking not enabled',
        url,
      };
    }

    const startTime = Date.now();
    
    try {
      // Parse URL and extract domain
      let domain = '';
      let isCustomScheme = false;
      
      // Check if it's a custom scheme first
      isCustomScheme = this.isCustomScheme(url);
      
      if (!isCustomScheme) {
        try {
          // Use regex to extract domain from URL
          const urlMatch = url.match(/^https?:\/\/([^\/]+)/);
          domain = urlMatch ? urlMatch[1] : '';
        } catch (error) {
          // Handle invalid URLs
          domain = '';
        }
      }
      
      // Check if domain is allowed
      const isAllowedDomain = this.isDomainAllowed(domain);
      
      console.log('🔗 Domain Check:', {
        url,
        domain,
        isAllowedDomain,
        allowedDomains: this.config?.allowedDomains,
        isCustomScheme
      });
      
      // Determine action
      let shouldOpenInApp = false;
      let reason = '';
      
      if (isCustomScheme) {
        shouldOpenInApp = true;
        reason = 'Custom scheme detected';
      } else if (isAllowedDomain) {
        shouldOpenInApp = true;
        reason = 'Domain is in allowed list';
      } else {
        shouldOpenInApp = false;
        reason = 'Domain not in allowed list';
      }

      // Record link data
      const linkData: DeepLinkData = {
        url,
        source,
        timestamp: Date.now(),
        metadata: {
          domain,
          isAllowedDomain,
          isCustomScheme,
          processingTime: Date.now() - startTime,
        },
      };
      
      this.linkHistory.push(linkData);
      this.linkHistory = this.linkHistory.slice(-100); // Keep last 100

      // Emit event
      emitEvent(EventType.DEEP_LINK_PROCESSED, {
        source: 'DeepLinkManager',
        data: linkData,
      });

      // Record performance
      performanceMonitor.recordMetric(MetricType.USER_INTERACTION, 'deep_link_processing_time', Date.now() - startTime, 'ms', { source: 'DeepLinkManager' });

      // Log result
      logger.info('Deep link processed', {
        url,
        domain,
        shouldOpenInApp,
        reason,
        processingTime: Date.now() - startTime,
      }, 'DeepLinkManager');

      return {
        handled: true,
        shouldOpenInApp,
        shouldRedirectToBrowser: !shouldOpenInApp && this.config!.redirectToBrowser,
        reason,
        url,
      };

    } catch (error) {
      logger.error('Error processing deep link', error as Error, { url }, 'DeepLinkManager');
      
      return {
        handled: false,
        shouldOpenInApp: false,
        shouldRedirectToBrowser: true,
        reason: 'Error processing URL',
        url,
      };
    }
  }

  /**
   * Check if a domain is in the allowed list
   */
  private isDomainAllowed(domain: string): boolean {
    if (!this.config?.allowedDomains) return false;
    
    return this.config.allowedDomains.some(allowedDomain => {
      // Exact match
      if (allowedDomain === domain) return true;
      
      // Wildcard subdomain match (e.g., *.example.com)
      if (allowedDomain.startsWith('*.')) {
        const baseDomain = allowedDomain.slice(2);
        return domain === baseDomain || domain.endsWith('.' + baseDomain);
      }
      
      return false;
    });
  }

  /**
   * Check if URL uses custom scheme
   */
  private isCustomScheme(url: string): boolean {
    if (!this.config?.customScheme) return false;
    
    return url.startsWith(this.config.customScheme + '://');
  }

  /**
   * Get link history
   */
  getLinkHistory(): DeepLinkData[] {
    return [...this.linkHistory];
  }

  /**
   * Get statistics
   */
  getStatistics(): Record<string, any> {
    const total = this.linkHistory.length;
    const inApp = this.linkHistory.filter(link => 
      link.metadata?.isAllowedDomain || link.metadata?.isCustomScheme
    ).length;
    const inBrowser = total - inApp;

    return {
      total,
      inApp,
      inBrowser,
      inAppPercentage: total > 0 ? (inApp / total) * 100 : 0,
      inBrowserPercentage: total > 0 ? (inBrowser / total) * 100 : 0,
    };
  }

  /**
   * Clear link history
   */
  clearHistory(): void {
    this.linkHistory = [];
    logger.info('Deep link history cleared', {}, 'DeepLinkManager');
  }

  /**
   * Get current configuration
   */
  getConfig(): DeepLinkConfig | null {
    return this.config;
  }

  /**
   * Check if deep linking is enabled
   */
  isEnabled(): boolean {
    return this.isInitialized && this.config?.enabled === true;
  }
}

// Export singleton instance
export const deepLinkManager = DeepLinkManager.getInstance();

// Export convenience functions
export const initializeDeepLinking = (config: DeepLinkConfig) => deepLinkManager.initialize(config);
export const processDeepLink = (url: string, source?: DeepLinkData['source']) => deepLinkManager.processURL(url, source);
export const getDeepLinkHistory = () => deepLinkManager.getLinkHistory();
export const getDeepLinkStatistics = () => deepLinkManager.getStatistics();
export const isDeepLinkingEnabled = () => deepLinkManager.isEnabled();
