import { Container, Typography } from '@mui/material'

export default function Suggest() {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Get a Suggestion</Typography>
      <Typography color="text.secondary">
        Coming in Phase 6 — ask the AI stylist what to wear based on your closet.
      </Typography>
    </Container>
  )
}