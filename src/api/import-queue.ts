import { apiRequest } from './client'
export type ImportDraft = {
  id: string
  source_url: string
  source_title: string
  channel_id: string
  proposed_channel_name: string
  proposed_channel_handle: string
  topic: string
  title: string
  content: string
  cover_image_url: string | null
  status: 'draft' | 'ready' | 'published' | 'rejected'
  published_post_id: string | null
  created_at: string
  updated_at: string
}
export type ImportScan = {
  imported: string[]
  errors: { package: string; error: string }[]
  inboxDir: string
}
export const listImportDrafts = () =>
  apiRequest<{ drafts: ImportDraft[]; scan: ImportScan }>('/import-drafts')
export const updateImportDraft = (id: string, patch: Partial<ImportDraft>) =>
  apiRequest<{ draft: ImportDraft }>(`/import-drafts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  })
export async function uploadImportDraftCover(id: string, image: File) {
  const body = new FormData()
  body.append('image', image)
  const response = await fetch(`/api/import-drafts/${encodeURIComponent(id)}/cover`, {
    method: 'POST',
    credentials: 'include',
    body
  })
  const result = await response.json().catch(() => ({ error: 'Cover upload failed.' }))
  if (!response.ok) throw new Error(result.error || 'Cover upload failed.')
  return result as { draft: ImportDraft }
}
