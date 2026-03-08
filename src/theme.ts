import { createTheme } from '@mui/material';

export type ThemeMode = 'dark' | 'light';

export const paletteMap = {
  dark: {
    background: '#101014',
    paper: '#171720',
    accent: '#8f1736',
    accentSoft: '#c23b61',
    border: 'rgba(255,255,255,0.1)',
    text: '#f7f1f3'
  },
  light: {
    background: '#f6f3f4',
    paper: '#ffffff',
    accent: '#8f1736',
    accentSoft: '#b72855',
    border: 'rgba(0,0,0,0.12)',
    text: '#1d1618'
  }
};

export function createMuiTheme(mode: ThemeMode, language: 'ar' | 'en') {
  const palette = paletteMap[mode];
  return createTheme({
    direction: language === 'ar' ? 'rtl' : 'ltr',
    shape: {
      borderRadius: 16
    },
    palette: {
      mode,
      primary: {
        main: palette.accent
      },
      secondary: {
        main: palette.accentSoft
      },
      background: {
        default: palette.background,
        paper: palette.paper
      },
      text: {
        primary: palette.text
      }
    },
    typography: {
      fontFamily: language === 'ar' ? 'Tahoma, Cairo, sans-serif' : 'Inter, Segoe UI, sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 700 }
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${palette.border}`
          }
        }
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            borderRadius: 12
          }
        }
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 14,
            background: mode === 'dark' ? 'linear-gradient(180deg, rgba(143,23,54,0.92), rgba(20,20,24,0.98))' : 'linear-gradient(180deg, rgba(143,23,54,0.96), rgba(177,40,85,0.92))',
            color: '#fff'
          }
        }
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            borderRadius: 14,
            color: '#fff'
          }
        }
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: '#fff',
            '&.Mui-selected': {
              backgroundColor: 'rgba(255,255,255,0.16)'
            },
            '&.Mui-selected:hover, &:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }
        }
      }
    }
  });
}
