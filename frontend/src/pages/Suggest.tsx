import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
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
}

interface Message {
  role: 'user' | 'ai'
  text: string
  items?: ClothingItem[]
}

const EXAMPLES = [
  "I'm going to a Broadway show, what should I wear?",
  "What's a good casual weekend outfit?",
  "I have a job interview tomorrow — what should I put together?",
]

function parseTags(tags: string | null): string[] {
  if (!tags) return []
  try { return JSON.parse(tags) } catch { return [] }
}

export default function Suggest() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ClothingItem | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    const query = input.trim()
    if (!query || loading) return

    setMessages(prev => [...prev, { role: 'user', text: query }])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('http://localhost:8000/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: data.suggestion, items: data.items ?? [] },
      ])
    } catch {
      setError('Could not get a suggestion. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Container
      maxWidth="md"
      sx={{ mt: 4, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}
    >
      <Typography variant="h4" gutterBottom>Get a Suggestion</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Describe an occasion and the AI stylist will suggest an outfit from your closet.
      </Typography>

      {/* Message area */}
      <Paper
        variant="outlined"
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          mb: 2,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 1.5,
            }}
          >
            <Typography color="text.disabled" sx={{ mb: 1 }}>Try one of these:</Typography>
            {EXAMPLES.map(ex => (
              <Button
                key={ex}
                variant="outlined"
                size="small"
                onClick={() => setInput(ex)}
                sx={{ textTransform: 'none', maxWidth: 420 }}
              >
                {ex}
              </Button>
            ))}
          </Box>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <Box key={i}>
            {/* Bubble */}
            <Box sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  maxWidth: '80%',
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                  color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  borderRadius: msg.role === 'user'
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                <Typography variant="body2">{msg.text}</Typography>
              </Paper>
            </Box>

            {/* Recommended item cards */}
            {msg.role === 'ai' && msg.items && msg.items.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  mt: 1.5,
                  overflowX: 'auto',
                  pb: 0.5,
                }}
              >
                {msg.items.map(item => (
                  <Card
                    key={item.id}
                    variant="outlined"
                    sx={{ minWidth: 140, maxWidth: 140, flexShrink: 0 }}
                  >
                    <CardActionArea onClick={() => setSelected(item)}>
                      <CardMedia
                        component="img"
                        image={`http://localhost:8000/${item.image_path}`}
                        alt={item.name ?? 'Clothing item'}
                        sx={{ height: 140, objectFit: 'cover' }}
                      />
                      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, display: 'block' }}
                          noWrap
                        >
                          {item.name ?? 'Item'}
                        </Typography>
                        {item.category && (
                          <Chip label={item.category} size="small" color="primary" sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }} />
                        )}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        ))}

        {/* Typing indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Paper
              elevation={0}
              sx={{
                px: 2, py: 1,
                bgcolor: 'grey.100',
                borderRadius: '16px 16px 16px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CircularProgress size={14} />
              <Typography variant="body2" color="text.secondary">Styling…</Typography>
            </Paper>
          </Box>
        )}

        <div ref={bottomRef} />
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

      {/* Input row */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="e.g. I'm going to a Broadway show, what should I wear?"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          size="small"
          multiline
          maxRows={3}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          sx={{ alignSelf: 'flex-end', whiteSpace: 'nowrap' }}
        >
          Send
        </Button>
      </Box>

      {/* Item detail dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                {selected.category && <Chip label={selected.category} color="primary" size="small" />}
                {selected.color && <Chip label={selected.color} variant="outlined" size="small" />}
              </Box>
              {selected.description && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="body2" color="text.secondary">{selected.description}</Typography>
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