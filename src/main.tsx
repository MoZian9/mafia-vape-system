import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import App from './App';
import './i18n';
import { AppProvider, useAppStore } from './store/AppContext';
import { createMuiTheme } from './theme';
import './styles.css';

const Root = () => {
  const { themeMode, language } = useAppStore();
  const theme = React.useMemo(() => createMuiTheme(themeMode, language), [themeMode, language]);
  React.useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <Root />
    </AppProvider>
  </React.StrictMode>
);