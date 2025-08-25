import { AppConfiguration } from '../config/AppConfig';

/**
 * Log levels for different types of messages
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
  error?: Error;
  context?: string;
}

/**
 * Professional logging utility with configurable levels and formatting
 */
class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isEnabled: boolean;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {
    const config = AppConfiguration.getConfig();
    this.logLevel = config.environment === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
    this.isEnabled = config.environment !== 'production' || __DEV__;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the minimum log level
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Enable or disable logging
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Log a debug message
   */
  public debug(message: string, data?: any, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, undefined, context);
  }

  /**
   * Log an info message
   */
  public info(message: string, data?: any, context?: string): void {
    this.log(LogLevel.INFO, message, data, undefined, context);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, data?: any, context?: string): void {
    this.log(LogLevel.WARN, message, data, undefined, context);
  }

  /**
   * Log an error message
   */
  public error(message: string, error?: Error, data?: any, context?: string): void {
    this.log(LogLevel.ERROR, message, data, error, context);
  }

  /**
   * Log a fatal error message
   */
  public fatal(message: string, error?: Error, data?: any, context?: string): void {
    this.log(LogLevel.FATAL, message, data, error, context);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, data?: any, error?: Error, context?: string): void {
    if (!this.isEnabled || level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      data,
      error,
      context,
    };

    // Add to internal log array
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Format and output the log
    const formattedMessage = this.formatLogEntry(entry);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage);
        break;
    }

    // In production, you might want to send logs to a remote service
    if (level >= LogLevel.ERROR && !__DEV__) {
      this.sendToRemoteService(entry);
    }
  }

  /**
   * Format a log entry for display
   */
  private formatLogEntry(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const levelName = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    const data = entry.data ? ` | Data: ${JSON.stringify(entry.data)}` : '';
    const error = entry.error ? ` | Error: ${entry.error.message}` : '';

    return `${timestamp} [${levelName}]${context} ${entry.message}${data}${error}`;
  }

  /**
   * Send log entry to remote service (placeholder)
   */
  private sendToRemoteService(entry: LogEntry): void {
    // In a real app, you would send this to your logging service
    // For example: Sentry, LogRocket, or your own API
    console.log('Sending to remote service:', entry);
  }

  /**
   * Get all logs
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get logs by level
   */
  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs by context
   */
  public getLogsByContext(context: string): LogEntry[] {
    return this.logs.filter(log => log.context === context);
  }

  /**
   * Export logs as JSON
   */
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const debug = (message: string, data?: any, context?: string) => logger.debug(message, data, context);
export const info = (message: string, data?: any, context?: string) => logger.info(message, data, context);
export const warn = (message: string, data?: any, context?: string) => logger.warn(message, data, context);
export const error = (message: string, error?: Error, data?: any, context?: string) => logger.error(message, error, data, context);
export const fatal = (message: string, error?: Error, data?: any, context?: string) => logger.fatal(message, error, data, context);
