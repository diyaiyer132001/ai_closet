import { AppBar, Toolbar, Typography, Box } from '@mui/material'
import { styled } from '@mui/material/styles'
import { NavLink } from 'react-router-dom'

const StyledNavLink = styled(NavLink)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textDecoration: 'none',
  fontSize: '0.72rem',
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  paddingBottom: '2px',
  borderBottom: '1px solid transparent',
  transition: 'color 0.2s, border-color 0.2s',
  '&.active': {
    color: theme.palette.text.primary,
    borderBottomColor: theme.palette.text.primary,
  },
  '&:hover': {
    color: theme.palette.text.primary,
  },
}))

export default function Nav() {
  return (
    <AppBar position="static" color="default" sx={{ bgcolor: 'white', borderBottom: '1px solid #e8e8e8' }}>
      <Toolbar sx={{ minHeight: '56px !important', px: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Typography
            sx={{
              fontWeight: 400,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              fontSize: '0.78rem',
              color: 'text.primary',
            }}
          >
            Lookbook Edit
          </Typography>
          <StyledNavLink to="/closet">Closet</StyledNavLink>
          <StyledNavLink to="/upload">Upload</StyledNavLink>
          <StyledNavLink to="/suggest">Suggest</StyledNavLink>
        </Box>
      </Toolbar>
    </AppBar>
  )
}