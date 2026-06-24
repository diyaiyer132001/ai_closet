import { Container, Typography } from '@mui/material'

export default function Closet() {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>My Closet</Typography>
      <Typography color="text.secondary">
        Coming in Phase 5 — your clothing items will appear here as a browsable grid.
      </Typography>
    </Container>
  )
}