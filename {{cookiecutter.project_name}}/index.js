/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';

console.log('[{{cookiecutter.project_name}}] entry loaded');
AppRegistry.registerComponent('{{cookiecutter.project_name}}', () => App);

// global error handler (safe guard)
if (global.ErrorUtils) {
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('[{{cookiecutter.project_name}}] global error:', error, 'isFatal:', isFatal);
  });
}
