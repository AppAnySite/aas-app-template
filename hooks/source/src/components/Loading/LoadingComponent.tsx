import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { LoadingComponentProps } from '../../types';

/**
 * Professional loading component with customizable appearance
 */
export const LoadingComponent: React.FC<LoadingComponentProps> = ({
  size = 'large',
  color,
  text,
  showSpinner = true,
  testID = 'loading-component',
  style,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const spinnerColor = color || theme.colors.primary;
  const textColor = theme.colors.text.secondary;

  return (
    <View style={[styles.container, style]} testID={testID}>
      {showSpinner && (
        <ActivityIndicator
          size={size}
          color={spinnerColor}
          style={styles.spinner}
          testID={`${testID}-spinner`}
        />
      )}
      
      {text && (
        <Text style={[styles.text, { color: textColor }]} testID={`${testID}-text`}>
          {text}
        </Text>
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  spinner: {
    marginBottom: theme.spacing.md,
  },
  text: {
    fontSize: theme.typography.body2.fontSize,
    fontWeight: theme.typography.body2.fontWeight,
    textAlign: 'center',
  },
});

export default LoadingComponent;
