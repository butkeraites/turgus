// Haptic feedback utilities for mobile devices

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification';

interface HapticFeedback {
  vibrate(pattern?: number | number[]): boolean;
  impact(style?: 'light' | 'medium' | 'heavy'): boolean;
  selection(): boolean;
  notification(type?: 'success' | 'warning' | 'error'): boolean;
}

class HapticFeedbackManager implements HapticFeedback {
  private isSupported: boolean;
  private hasVibration: boolean;

  constructor() {
    this.isSupported = 'vibrate' in navigator;
    this.hasVibration = this.isSupported && typeof navigator.vibrate === 'function';
  }

  /**
   * Basic vibration pattern
   */
  vibrate(pattern: number | number[] = 50): boolean {
    if (!this.hasVibration) return false;

    try {
      navigator.vibrate(pattern);
      return true;
    } catch (error) {
      console.warn('Vibration failed:', error);
      return false;
    }
  }

  /**
   * Impact feedback for button presses, selections, etc.
   */
  impact(style: 'light' | 'medium' | 'heavy' = 'medium'): boolean {
    if (!this.hasVibration) return false;

    const patterns = {
      light: 10,
      medium: 20,
      heavy: 40
    };

    return this.vibrate(patterns[style]);
  }

  /**
   * Selection feedback for UI element selection
   */
  selection(): boolean {
    if (!this.hasVibration) return false;
    return this.vibrate(5);
  }

  /**
   * Notification feedback for alerts, confirmations, etc.
   */
  notification(type: 'success' | 'warning' | 'error' = 'success'): boolean {
    if (!this.hasVibration) return false;

    const patterns = {
      success: [50, 50, 50],
      warning: [100, 50, 100],
      error: [200, 100, 200, 100, 200]
    };

    return this.vibrate(patterns[type]);
  }

  /**
   * Check if haptic feedback is supported
   */
  isHapticSupported(): boolean {
    return this.hasVibration;
  }

  /**
   * Disable haptic feedback (for user preference)
   */
  disable(): void {
    this.hasVibration = false;
  }

  /**
   * Enable haptic feedback (if supported)
   */
  enable(): void {
    this.hasVibration = this.isSupported;
  }
}

// Create singleton instance
export const haptics = new HapticFeedbackManager();

// Convenience functions for common use cases
export const hapticFeedback = {
  // Button press feedback
  buttonPress: () => haptics.impact('light'),
  
  // Selection feedback (for toggles, checkboxes, etc.)
  selection: () => haptics.selection(),
  
  // Success feedback (for completed actions)
  success: () => haptics.notification('success'),
  
  // Error feedback (for failed actions)
  error: () => haptics.notification('error'),
  
  // Warning feedback (for important alerts)
  warning: () => haptics.notification('warning'),
  
  // Swipe feedback (for gesture interactions)
  swipe: () => haptics.impact('light'),
  
  // Long press feedback
  longPress: () => haptics.impact('medium'),
  
  // Pull to refresh feedback
  pullToRefresh: () => haptics.impact('light'),
  
  // Navigation feedback
  navigation: () => haptics.selection(),
};

// React hook for haptic feedback
export function useHapticFeedback() {
  return {
    haptics,
    ...hapticFeedback,
    isSupported: haptics.isHapticSupported()
  };
}