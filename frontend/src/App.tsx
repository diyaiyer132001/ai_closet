import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material'
import Nav from './components/Nav'
import Closet from './pages/Closet'
import Upload from './pages/Upload'
import Suggest from './pages/Suggest'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a1a1a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6b6b6b',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    divider: '#e8e8e8',
    text: {
      primary: '#1a1a1a',
      secondary: '#6b6b6b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h4: { fontWeight: 300, letterSpacing: '-0.01em' },
    h5: { fontWeight: 300, letterSpacing: '-0.01em' },
    h6: { fontWeight: 500 },
  },
  shape: {
    borderRadius: 0,
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { letterSpacing: '0.08em' },
        contained: { '&:hover': { backgroundColor: '#333' } },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: 'none', border: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 2, fontSize: '0.7rem', letterSpacing: '0.03em' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 0 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 0 },
      },
    },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Navigate to="/closet" replace />} />
          <Route path="/closet" element={<Closet />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/suggest" element={<Suggest />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App