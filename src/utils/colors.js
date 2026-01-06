// IVRI Tours Brand Colors
export const colors = {
  // Primary brand colors from logo
  primary: {
    teal: '#00BCD4',      // Main teal/cyan color
    tealDark: '#00ACC1',  // Darker teal
    tealLight: '#26C6DA', // Lighter teal
    black: '#2B2B2B',     // Logo black
    white: '#FFFFFF',      // White
  },

  // Semantic colors
  success: '#10b981',     // Green for occupied seats
  warning: '#f59e0b',     // Orange for warnings
  error: '#ef4444',       // Red for errors
  info: '#3b82f6',        // Blue for selected

  // UI colors
  background: {
    light: '#F5F5F5',     // Light gray background
    white: '#FFFFFF',     // White background
    dark: '#2B2B2B',      // Dark background
  },

  text: {
    primary: '#2B2B2B',   // Primary text (black)
    secondary: '#6B7280', // Secondary text (gray)
    light: '#9CA3AF',     // Light text
    white: '#FFFFFF',     // White text
  },

  // Seat colors
  seat: {
    vacant: '#E5E7EB',    // Gray for empty seats
    occupied: '#10b981',  // Green for occupied
    selected: '#00BCD4',  // Teal for selected
  },

  // Button colors
  button: {
    primary: '#00BCD4',       // Teal button
    primaryHover: '#00ACC1',  // Teal hover
    secondary: '#6B7280',     // Gray button
    secondaryHover: '#4B5563',// Gray hover
    danger: '#ef4444',        // Red button
    dangerHover: '#dc2626',   // Red hover
  },

  // Gradient backgrounds
  gradient: {
    primary: 'linear-gradient(135deg, #00BCD4 0%, #26C6DA 100%)',
    dark: 'linear-gradient(135deg, #2B2B2B 0%, #404040 100%)',
    light: 'linear-gradient(135deg, #F5F5F5 0%, #FFFFFF 100%)',
  }
};

// Tailwind class mappings for easy use
export const tw = {
  primary: 'bg-[#00BCD4] hover:bg-[#00ACC1]',
  primaryText: 'text-[#00BCD4]',
  secondary: 'bg-[#2B2B2B] hover:bg-[#404040]',
  secondaryText: 'text-[#2B2B2B]',
  success: 'bg-green-500 hover:bg-green-600',
  error: 'bg-red-500 hover:bg-red-600',
};

export default colors;
