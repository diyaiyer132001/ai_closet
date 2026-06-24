import { AppBar, Toolbar, Typography, Box } from '@mui/material'
import { styled } from '@mui/material/styles'
import { NavLink } from 'react-router-dom'

const StyledNavLink = styled(NavLink)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textDecoration: 'none',
  padding: '4px 12px',
  borderRadius: theme.shape.borderRadius,
  fontSize: '0.925rem',
  fontWeight: theme.typography.fontWeightMedium,
  transition: 'color 0.2s',
  '&.active': {
    color: theme.palette.text.primary,
    fontWeight: theme.typography.fontWeightBold,
  },
  '&:hover': {
    color: theme.palette.text.primary,
  },
}))

export default function Nav() {
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          AI Closet
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <StyledNavLink to="/closet">Closet</StyledNavLink>
          <StyledNavLink to="/upload">Upload</StyledNavLink>
          <StyledNavLink to="/suggest">Suggest</StyledNavLink>
        </Box>
      </Toolbar>
    </AppBar>
  )
}