import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material'
import Nav from './components/Nav'
import Closet from './pages/Closet'
import Upload from './pages/Upload'
import Suggest from './pages/Suggest'

const theme = createTheme()

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