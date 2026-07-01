import { useState, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material'

interface UploadedItem {
  id: number
  name: string | null
  category: string | null
  color: string | null
  description: string | null
  tags: string | null
  image_path: string
}

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedItem, setUploadedItem] = useState<UploadedItem | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function selectFile(f: File) {
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setUploadedItem(null)
    setError(null)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) selectFile(f)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) selectFile(f)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('http://localhost:8000/items/upload', {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail ?? 'Upload failed')
      }
      const item: UploadedItem = await res.json()
      setUploadedItem(item)
      setFile(null)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function reset() {
    setUploadedItem(null)
    setFile(null)
    setPreview(null)
    setError(null)
  }

  const parsedTags: string[] = uploadedItem?.tags
    ? (() => { try { return JSON.parse(uploadedItem.tags) } catch { return [] } })()
    : []

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>Upload</Typography>
      <Typography color="text.secondary" sx={{ mb: 4, fontSize: '0.9rem', letterSpacing: '0.02em' }}>
        Add a photo of a clothing item to your closet.
      </Typography>

      {!uploadedItem && (
        <>
          {/* Drop zone */}
          <Box
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            sx={{
              border: '1px solid',
              borderColor: dragging ? 'text.primary' : '#d0d0d0',
              p: 6,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: dragging ? '#fafafa' : 'transparent',
              transition: 'border-color 0.2s, background-color 0.2s',
              mb: 3,
              userSelect: 'none',
            }}
          >
            <Typography
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontSize: '0.75rem',
                fontWeight: 500,
                mb: 0.75,
              }}
            >
              Drag & drop an image here
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.04em' }}>
              or click to browse
            </Typography>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleChange}
            />
          </Box>

          {/* Preview */}
          {preview && (
            <Box sx={{ mb: 3 }}>
              <Box
                component="img"
                src={preview}
                alt="Preview"
                sx={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block', bgcolor: '#f5f5f5' }}
              />
            </Box>
          )}

          {file && (
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleUpload}
              disabled={uploading}
              sx={{ py: 1.5, fontSize: '0.75rem', letterSpacing: '0.12em', mb: 2 }}
            >
              {uploading ? (
                <>
                  <CircularProgress size={16} color="inherit" sx={{ mr: 1.5 }} />
                  Analyzing with AI…
                </>
              ) : (
                'Add to Closet'
              )}
            </Button>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </>
      )}

      {/* Result */}
      {uploadedItem && (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>Item added to your closet.</Alert>

          <Box
            component="img"
            src={`http://localhost:8000/${uploadedItem.image_path}`}
            alt={uploadedItem.name ?? 'Clothing item'}
            sx={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block', bgcolor: '#f5f5f5', mb: 2 }}
          />

          {uploadedItem.name && (
            <Typography variant="h6" sx={{ mb: 1 }}>{uploadedItem.name}</Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
            {uploadedItem.category && <Chip label={uploadedItem.category} size="small" color="primary" />}
            {uploadedItem.color && <Chip label={uploadedItem.color} size="small" variant="outlined" />}
          </Box>

          {uploadedItem.description && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 1.5 }}>
                {uploadedItem.description}
              </Typography>
            </>
          )}

          {parsedTags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 3 }}>
              {parsedTags.map(tag => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          )}

          <Button
            variant="outlined"
            fullWidth
            onClick={reset}
            sx={{ py: 1.5, fontSize: '0.75rem', letterSpacing: '0.12em' }}
          >
            Upload Another
          </Button>
        </Box>
      )}
    </Container>
  )
}