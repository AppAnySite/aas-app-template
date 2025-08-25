import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { BaseComponentProps } from '../../types';

/**
 * Network status component that shows connection state
 */
export const NetworkStatusComponent: React.FC<BaseComponentProps> = ({
  testID = 'network-status-component',
  style,
}) => {
  const { theme } = useTheme();
  const [isConnected, setIsConnected] = useState(true);
  const [networkType, setNetworkType] = useState<string>('');
  const [showBanner, setShowBanner] = useState(false);
  const bannerOpacity = new Animated.Value(0);

  useEffect(() => {
    // Simplified network status for now
    // In a real app, you would use NetInfo or similar
    const checkConnection = () => {
      // Mock network check - always connected for now
      setIsConnected(true);
      setNetworkType('wifi');
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  const styles = createStyles(theme);

  if (!showBanner) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        { opacity: bannerOpacity },
        style
      ]} 
      testID={testID}
    >
      <Text style={styles.text}>
        No internet connection
      </Text>
    </Animated.View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.error,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    zIndex: 1000,
  },
  text: {
    color: theme.colors.background,
    fontSize: theme.typography.body2.fontSize,
    fontWeight: theme.typography.body2.fontWeight,
    textAlign: 'center',
  },
});

export default NetworkStatusComponent;
