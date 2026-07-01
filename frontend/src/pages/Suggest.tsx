import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
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
      sx={{ mt: 5, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}
    >
      <Typography variant="h4" sx={{ mb: 1 }}>Get a Suggestion</Typography>
      <Typography color="text.secondary" sx={{ mb: 3, fontSize: '0.9rem', letterSpacing: '0.02em' }}>
        Describe an occasion and the AI stylist will suggest an outfit from your closet.
      </Typography>

      {/* Message area */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          border: '1px solid #e8e8e8',
          p: 2.5,
          mb: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
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
            <Typography
              color="text.disabled"
              sx={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1 }}
            >
              Try one of these
            </Typography>
            {EXAMPLES.map(ex => (
              <Button
                key={ex}
                variant="outlined"
                size="small"
                onClick={() => setInput(ex)}
                sx={{
                  textTransform: 'none',
                  maxWidth: 440,
                  fontSize: '0.82rem',
                  letterSpacing: '0.02em',
                  fontWeight: 400,
                  borderColor: '#d0d0d0',
                  color: 'text.secondary',
                  '&:hover': { borderColor: 'text.primary', color: 'text.primary', bgcolor: 'transparent' },
                }}
              >
                {ex}
              </Button>
            ))}
          </Box>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <Box key={i}>
            <Box sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <Box
                sx={{
                  p: '12px 16px',
                  maxWidth: '80%',
                  bgcolor: msg.role === 'user' ? '#1a1a1a' : '#f5f5f5',
                  color: msg.role === 'user' ? '#ffffff' : 'text.primary',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                <Typography variant="body2" sx={{ lineHeight: 1.65 }}>{msg.text}</Typography>
              </Box>
            </Box>

            {/* Recommended item cards */}
            {msg.role === 'ai' && msg.items && msg.items.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, overflowX: 'auto', pb: 0.5 }}>
                {msg.items.map(item => (
                  <Card
                    key={item.id}
                    variant="outlined"
                    sx={{ minWidth: 130, maxWidth: 130, flexShrink: 0, border: '1px solid #e8e8e8' }}
                  >
                    <CardActionArea onClick={() => setSelected(item)}>
                      <CardMedia
                        component="img"
                        image={`http://localhost:8000/${item.image_path}`}
                        alt={item.name ?? 'Clothing item'}
                        sx={{ height: 130, objectFit: 'cover', bgcolor: '#f5f5f5' }}
                      />
                      <CardContent sx={{ p: '8px 10px', '&:last-child': { pb: '8px' } }}>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 500, display: 'block', lineHeight: 1.3 }}
                          noWrap
                        >
                          {item.name ?? 'Item'}
                        </Typography>
                        {item.category && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.62rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              color: 'text.secondary',
                            }}
                          >
                            {item.category}
                          </Typography>
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
            <Box
              sx={{
                px: 2, py: 1.25,
                bgcolor: '#f5f5f5',
                borderRadius: '16px 16px 16px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CircularProgress size={13} sx={{ color: '#6b6b6b' }} />
              <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.05em' }}>
                Styling…
              </Typography>
            </Box>
          </Box>
        )}

        <div ref={bottomRef} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

      {/* Input row */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
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
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 0,
              fontSize: '0.875rem',
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          sx={{
            alignSelf: 'flex-end',
            whiteSpace: 'nowrap',
            px: 3,
            py: '9px',
            fontSize: '0.72rem',
            letterSpacing: '0.12em',
          }}
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
              <Button
                onClick={() => setSelected(null)}
                size="small"
                sx={{ color: 'text.secondary', fontSize: '0.72rem', letterSpacing: '0.08em' }}
              >
                Close
              </Button>
            </DialogTitle>
            <DialogContent>
              <Box
                component="img"
                src={`http://localhost:8000/${selected.image_path}`}
                alt={selected.name ?? 'Clothing item'}
                sx={{ width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block', mb: 2, bgcolor: '#f5f5f5' }}
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