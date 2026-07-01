import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Grid,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Divider,
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
    <Container maxWidth="xl" sx={{ mt: 5, px: { xs: 2, sm: 4 } }}>
      <Typography variant="h4" sx={{ mb: 4 }}>My Closet</Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress size={28} sx={{ color: '#1a1a1a' }} />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && items.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 12 }}>
          <Typography color="text.secondary" sx={{ mb: 3, letterSpacing: '0.04em' }}>
            Your closet is empty.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/upload')}
            sx={{ px: 4, py: 1.5, fontSize: '0.75rem', letterSpacing: '0.12em' }}
          >
            Upload your first item
          </Button>
        </Box>
      )}

      {/* Category filter tabs */}
      {!loading && items.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            gap: 0,
            mb: 5,
            borderBottom: '1px solid #e8e8e8',
            overflowX: 'auto',
          }}
        >
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              onClick={() => setFilter(cat)}
              disableRipple
              sx={{
                borderRadius: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontSize: '0.68rem',
                fontWeight: filter === cat ? 600 : 400,
                color: filter === cat ? 'text.primary' : 'text.secondary',
                borderBottom: filter === cat ? '2px solid #1a1a1a' : '2px solid transparent',
                mb: '-1px',
                px: 2,
                py: 1.5,
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                bgcolor: 'transparent',
                '&:hover': { bgcolor: 'transparent', color: 'text.primary' },
              }}
            >
              {cat}
            </Button>
          ))}
        </Box>
      )}

      {!loading && !error && items.length > 0 && filtered.length === 0 && (
        <Typography color="text.secondary" sx={{ letterSpacing: '0.04em' }}>
          No items in this category.
        </Typography>
      )}

      {/* Product grid */}
      <Grid container spacing={3}>
        {filtered.map(item => (
          <Grid key={item.id} size={{ xs: 6, sm: 4, md: 3 }}>
            <Box
              sx={{ cursor: 'pointer' }}
              onClick={() => setSelected(item)}
            >
              <Box
                component="img"
                src={`http://localhost:8000/${item.image_path}`}
                alt={item.name ?? 'Clothing item'}
                sx={{
                  width: '100%',
                  aspectRatio: '3/4',
                  objectFit: 'cover',
                  display: 'block',
                  bgcolor: '#f5f5f5',
                  transition: 'opacity 0.25s',
                  '&:hover': { opacity: 0.82 },
                }}
              />
              <Box sx={{ pt: 1.5 }}>
                {item.category && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.09em',
                      color: 'text.secondary',
                      mb: 0.25,
                      fontSize: '0.65rem',
                    }}
                  >
                    {item.category}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {item.name ?? 'Unnamed item'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Detail dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 1,
                letterSpacing: '0.02em',
              }}
            >
              <span>{selected.name ?? 'Clothing item'}</span>
              <Button
                onClick={() => setSelected(null)}
                size="small"
                sx={{ color: 'text.secondary', letterSpacing: '0.08em', fontSize: '0.72rem' }}
              >
                Close
              </Button>
            </DialogTitle>
            <DialogContent>
              <Box
                component="img"
                src={`http://localhost:8000/${selected.image_path}`}
                alt={selected.name ?? 'Clothing item'}
                sx={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block', mb: 2, bgcolor: '#f5f5f5' }}
              />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                {selected.category && <Chip label={selected.category} color="primary" size="small" />}
                {selected.color && <Chip label={selected.color} variant="outlined" size="small" />}
              </Box>
              {selected.description && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
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