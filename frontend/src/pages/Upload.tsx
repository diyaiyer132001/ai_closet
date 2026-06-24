import { Container, Typography } from '@mui/material'

export default function Upload() {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Upload</Typography>
      <Typography color="text.secondary">
        Coming in Phase 3 — drag and drop photos of your clothing here to add them to your closet.
      </Typography>
    </Container>
  )
}