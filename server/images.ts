import { del, put } from '@vercel/blob'

/**
 * Armazenamento de imagens via Vercel Blob (cota gratuita no plano Hobby).
 * Para trocar de provedor (UploadThing, Cloudinary...), basta reimplementar
 * estas duas funções.
 */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

export function hasImageStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export async function uploadImage(file: File): Promise<string> {
  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'webp'
  const blob = await put(`gifts/${crypto.randomUUID()}.${ext}`, file, {
    access: 'public',
    contentType: file.type,
  })
  return blob.url
}

export async function deleteImage(url: string) {
  if (!hasImageStorage() || !url.includes('.blob.vercel-storage.com')) return
  try {
    await del(url)
  } catch (err) {
    console.error('[images] falha ao remover imagem', err)
  }
}
