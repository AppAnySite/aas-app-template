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
}

// Default WebView configuration
export const defaultWebViewConfig: WebViewConfig = {
  url: 'https://example.com', // Change this to your website URL
  title: 'MultiMagix App',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  allowFileAccess: false,
  allowUniversalAccessFromFileURLs: false,
  allowFileAccessFromFileURLs: false,
  javaScriptEnabled: true,
  domStorageEnabled: true,
  startInLoadingState: true,
  scalesPageToFit: true,
  allowsInlineMediaPlayback: true,
  mediaPlaybackRequiresUserAction: false,
  allowsFullscreenVideo: true,
  mixedContentMode: 'compatibility',
  cacheEnabled: true,
  cacheMode: 'LOAD_DEFAULT',
};

// Function to update WebView configuration
export const updateWebViewConfig = (newConfig: Partial<WebViewConfig>): WebViewConfig => {
  return {
    ...defaultWebViewConfig,
    ...newConfig,
  };
};

// Function to validate URL
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};


