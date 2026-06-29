import { useState, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Divider,
  Paper,
} from '@mui/material'

interface UploadedItem {
  id: number
  name: string | null
  category: string | null
  color: string | null
  description: string | null
  tags: string | null  // JSON-encoded array e.g. '["casual","summer"]'
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
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Upload</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Add a photo of a clothing item to your closet.
      </Typography>

      {/* Drop zone — hidden once an item has been successfully uploaded */}
      {!uploadedItem && (
        <>
          <Box
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            sx={{
              border: '2px dashed',
              borderColor: dragging ? 'primary.main' : 'grey.400',
              borderRadius: 2,
              p: 5,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: dragging ? 'action.hover' : 'background.paper',
              transition: 'border-color 0.2s, background-color 0.2s',
              mb: 2,
              userSelect: 'none',
            }}
          >
            <Typography variant="h2" component="div" sx={{ mb: 1 }}>📷</Typography>
            <Typography sx={{ fontWeight: 500 }}>Drag & drop an image here</Typography>
            <Typography variant="body2" color="text.secondary">or click to browse</Typography>
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
            <Paper variant="outlined" sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
              <Box
                component="img"
                src={preview}
                alt="Preview"
                sx={{ width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block' }}
              />
            </Paper>
          )}

          {/* Upload button */}
          {file && (
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleUpload}
              disabled={uploading}
              sx={{ mb: 2 }}
            >
              {uploading ? (
                <>
                  <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
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

      {/* AI result card */}
      {uploadedItem && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            Item added to your closet!
          </Alert>

          <Card variant="outlined">
            <CardMedia
              component="img"
              image={`http://localhost:8000/${uploadedItem.image_path}`}
              alt={uploadedItem.name ?? 'Clothing item'}
              sx={{ maxHeight: 320, objectFit: 'contain', bgcolor: 'grey.50' }}
            />
            <CardContent>
              {uploadedItem.name && (
                <Typography variant="h6" gutterBottom>
                  {uploadedItem.name}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                {uploadedItem.category && (
                  <Chip label={uploadedItem.category} size="small" color="primary" />
                )}
                {uploadedItem.color && (
                  <Chip label={uploadedItem.color} size="small" variant="outlined" />
                )}
              </Box>

              {uploadedItem.description && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {uploadedItem.description}
                  </Typography>
                </>
              )}

              {parsedTags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1.5 }}>
                  {parsedTags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          <Button variant="outlined" fullWidth sx={{ mt: 2 }} onClick={reset}>
            Upload Another
          </Button>
        </Box>
      )}
    </Container>
  )
}