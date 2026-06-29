import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'

interface ClothingItem {
  id: number
  name: string | null
  category: string | null
  color: string | null
  description: string | null
  tags: string | null
  image_path: string
  created_at: string
}

const CATEGORIES = ['all', 'top', 'bottom', 'dress', 'shoes', 'outerwear', 'accessory', 'other']

function parseTags(tags: string | null): string[] {
  if (!tags) return []
  try { return JSON.parse(tags) } catch { return [] }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function Closet() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<ClothingItem | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('http://localhost:8000/items')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch')
        return r.json()
      })
      .then((data: ClothingItem[]) => setItems(data))
      .catch(() => setError('Could not load your closet. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter)

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>My Closet</Typography>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error */}
      {error && <Alert severity="error">{error}</Alert>}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Your closet is empty. Upload some clothing photos to get started.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/upload')}>
            Upload your first item
          </Button>
        </Box>
      )}

      {/* Category filter — only shown when there are items */}
      {!loading && items.length > 0 && (
        <Box sx={{ mb: 3, overflowX: 'auto' }}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, val) => val && setFilter(val)}
            size="small"
          >
            {CATEGORIES.map(cat => (
              <ToggleButton key={cat} value={cat}>
                {capitalize(cat)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}

      {/* No results for this filter */}
      {!loading && !error && items.length > 0 && filtered.length === 0 && (
        <Typography color="text.secondary">No items in this category.</Typography>
      )}

      {/* Item grid */}
      <Grid container spacing={2}>
        {filtered.map(item => (
          <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardActionArea onClick={() => setSelected(item)} sx={{ flexGrow: 1 }}>
                <CardMedia
                  component="img"
                  image={`http://localhost:8000/${item.image_path}`}
                  alt={item.name ?? 'Clothing item'}
                  sx={{ height: 220, objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                    {item.name ?? 'Unnamed item'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    {item.category && (
                      <Chip label={item.category} size="small" color="primary" />
                    )}
                    {item.color && (
                      <Chip label={item.color} size="small" variant="outlined" />
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Detail dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>{selected.name ?? 'Clothing item'}</span>
              <Button onClick={() => setSelected(null)} size="small">Close</Button>
            </DialogTitle>
            <DialogContent>
              <Box
                component="img"
                src={`http://localhost:8000/${selected.image_path}`}
                alt={selected.name ?? 'Clothing item'}
                sx={{ width: '100%', maxHeight: 400, objectFit: 'contain', mb: 2, borderRadius: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                {selected.category && (
                  <Chip label={selected.category} color="primary" size="small" />
                )}
                {selected.color && (
                  <Chip label={selected.color} variant="outlined" size="small" />
                )}
              </Box>
              {selected.description && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    {selected.description}
                  </Typography>
                </>
              )}
              {parseTags(selected.tags).length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1.5 }}>
                  {parseTags(selected.tags).map(tag => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Container>
  )
}