import type { CSSProperties } from 'react';

export interface Theme {
  color: string;
  mode: 'light' | 'dark';
}

type ThemeDefinition = {
  [mode in Theme['mode']]: {
    [variable: string]: string;
  };
};

const themes: { [color: string]: ThemeDefinition } = {
  default: {
    light: {
      '--background': '0 0% 100%',
      '--foreground': '240 10% 3.9%',
      '--primary': '203 89% 53%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '240 5% 90%',
      '--accent-foreground': '240 5.9% 10%',
      '--card': '0 0% 100%',
      '--card-foreground': '240 10% 3.9%',
      '--border': '240 5.9% 90%',
      '--muted': '240 5% 90%',
      '--muted-foreground': '240 10% 3.9%',
    },
    dark: {
      '--background': '240 5% 7%',
      '--foreground': '0 0% 98%',
      '--primary': '203 89% 53%',
      '--primary-foreground': '0 0% 98%',
      '--accent': '240 4% 18%',
      '--accent-foreground': '0 0% 98%',
      '--card': '240 4% 12%',
      '--card-foreground': '0 0% 98%',
      '--border': '240 4% 18%',
      '--muted': '240 5% 20%',
      '--muted-foreground': '240 5% 64.9%',
    },
  },
  blue: {
    light: {
      '--background': '210 40% 98%',
      '--foreground': '222.2 84% 4.9%',
      '--primary': '217.2 91.2% 59.8%',
      '--primary-foreground': '210 40% 98%',
      '--accent': '210 40% 92%',
      '--accent-foreground': '217.2 91.2% 59.8%',
      '--card': '0 0% 100%',
      '--card-foreground': '222.2 84% 4.9%',
      '--border': '214.3 31.8% 91.4%',
    },
    dark: {
      '--background': '222.2 84% 4.9%',
      '--foreground': '210 40% 98%',
      '--primary': '217.2 91.2% 59.8%',
      '--primary-foreground': '210 40% 98%',
      '--accent': '217.2 32.6% 17.5%',
      '--accent-foreground': '210 40% 98%',
      '--card': '222.2 84% 4.9%',
      '--card-foreground': '210 40% 98%',
      '--border': '217.2 32.6% 17.5%',
    },
  },
  black: {
    light: {
      '--background': '0 0% 95%',
      '--foreground': '0 0% 3.9%',
      '--primary': '0 0% 9%',
      '--primary-foreground': '0 0% 98%',
      '--accent': '0 0% 90%',
      '--accent-foreground': '0 0% 9%',
      '--card': '0 0% 100%',
      '--card-foreground': '0 0% 3.9%',
      '--border': '0 0% 89.8%',
    },
    dark: {
      '--background': '0 0% 3.9%',
      '--foreground': '0 0% 98%',
      '--primary': '0 0% 90%',
      '--primary-foreground': '0 0% 3.9%',
      '--accent': '0 0% 14.9%',
      '--accent-foreground': '0 0% 98%',
      '--card': '0 0% 3.9%',
      '--card-foreground': '0 0% 98%',
      '--border': '0 0% 14.9%',
    },
  },
  pink: {
    light: {
      '--background': '340 60% 97%',
      '--foreground': '346.8 77.2% 49.8%',
      '--primary': '346.8 77.2% 49.8%',
      '--primary-foreground': '355.7 100% 97.3%',
      '--accent': '340 60% 94%',
      '--accent-foreground': '346.8 77.2% 49.8%',
      '--card': '0 0% 100%',
      '--card-foreground': '346.8 77.2% 49.8%',
      '--border': '340 60% 91.4%',
    },
    dark: {
      '--background': '338.9 70.1% 14.1%',
      '--foreground': '340 100% 97.3%',
      '--primary': '346.8 77.2% 49.8%',
      '--primary-foreground': '355.7 100% 97.3%',
      '--accent': '346.8 32.6% 17.5%',
      '--accent-foreground': '340 100% 97.3%',
      '--card': '338.9 70.1% 14.1%',
      '--card-foreground': '340 100% 97.3%',
      '--border': '346.8 32.6% 17.5%',
    },
  },
  yellow: {
    light: {
      '--background': '45 93% 95%',
      '--foreground': '24 9.8% 10%',
      '--primary': '47.9 95.8% 53.1%',
      '--primary-foreground': '24 9.8% 10%',
      '--accent': '45 93% 90%',
      '--accent-foreground': '24 9.8% 10%',
      '--card': '0 0% 100%',
      '--card-foreground': '24 9.8% 10%',
      '--border': '45 93% 85%',
    },
    dark: {
      '--background': '20 14.3% 4.1%',
      '--foreground': '60 9.1% 97.8%',
      '--primary': '47.9 95.8% 53.1%',
      '--primary-foreground': '24 9.8% 10%',
      '--accent': '12 6.5% 15.1%',
      '--accent-foreground': '60 9.1% 97.8%',
      '--card': '20 14.3% 4.1%',
      '--card-foreground': '60 9.1% 97.8%',
      '--border': '12 6.5% 15.1%',
    },
  },
  green: {
    light: {
      '--background': '141 76% 97%',
      '--foreground': '142.1 76.2% 36.3%',
      '--primary': '142.1 76.2% 36.3%',
      '--primary-foreground': '144.9 80.4% 97.3%',
      '--accent': '141 76% 92%',
      '--accent-foreground': '142.1 76.2% 36.3%',
      '--card': '0 0% 100%',
      '--card-foreground': '142.1 76.2% 36.3%',
      '--border': '141 76% 88%',
    },
    dark: {
      '--background': '142.1 70.6% 15.1%',
      '--foreground': '144.9 80.4% 97.3%',
      '--primary': '142.1 76.2% 36.3%',
      '--primary-foreground': '144.9 80.4% 97.3%',
      '--accent': '142.1 70.6% 20%',
      '--accent-foreground': '144.9 80.4% 97.3%',
      '--card': '142.1 70.6% 15.1%',
      '--card-foreground': '144.9 80.4% 97.3%',
      '--border': '142.1 70.6% 25%',
    },
  },
  violet: {
    light: {
      '--background': '262 80% 97%',
      '--foreground': '263.4 70% 50.4%',
      '--primary': '263.4 70% 50.4%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '262 80% 94%',
      '--accent-foreground': '263.4 70% 50.4%',
      '--card': '0 0% 100%',
      '--card-foreground': '263.4 70% 50.4%',
      '--border': '262 80% 90%',
    },
    dark: {
      '--background': '263.4 70.4% 15.1%',
      '--foreground': '260 100% 97.3%',
      '--primary': '263.4 70% 50.4%',
      '--primary-foreground': '260 100% 97.3%',
      '--accent': '263.4 70.4% 20%',
      '--accent-foreground': '260 100% 97.3%',
      '--card': '263.4 70.4% 15.1%',
      '--card-foreground': '260 100% 97.3%',
      '--border': '263.4 70.4% 25%',
    },
  },
  white: {
    light: {
      '--background': '0 0% 100%',
      '--foreground': '0 0% 3.9%',
      '--primary': '0 0% 9%',
      '--primary-foreground': '0 0% 98%',
      '--accent': '0 0% 94%',
      '--accent-foreground': '0 0% 9%',
      '--card': '0 0% 100%',
      '--card-foreground': '0 0% 3.9%',
      '--border': '0 0% 89.8%',
    },
    dark: {
      '--background': '0 0% 9%',
      '--foreground': '0 0% 98%',
      '--primary': '0 0% 98%',
      '--primary-foreground': '0 0% 9%',
      '--accent': '0 0% 14.9%',
      '--accent-foreground': '0 0% 98%',
      '--card': '0 0% 9%',
      '--card-foreground': '0 0% 98%',
      '--border': '0 0% 14.9%',
    },
  }
};

export function getThemeCssProperties(color: string, mode: Theme['mode']): CSSProperties {
  const theme = themes[color] || themes.default;
  const properties = theme[mode] || theme.light;
  return properties as CSSProperties;
}
