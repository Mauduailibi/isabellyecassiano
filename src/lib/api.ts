import type { Contribution, Gift, GiftInput, GiftStatus } from '../../shared/types'

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData
  const res = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...init,
    headers: isForm ? init.headers : { 'Content-Type': 'application/json', ...init.headers },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error ?? 'Algo deu errado. Tente novamente.', res.status)
  return data as T
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

const json = (body: unknown) => JSON.stringify(body)

export const api = {
  listGifts: () => request<Gift[]>('/gifts'),
  createContribution: (body: { giftId: string; guestName: string; message: string; website: string }) =>
    request<{ id: string }>('/contributions', { method: 'POST', body: json(body) }),

  session: () => request<{ authenticated: boolean }>('/auth/session'),
  login: (password: string) => request('/auth/login', { method: 'POST', body: json({ password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  adminConfig: () => request<{ imageUpload: boolean; storage: 'firebase' | 'memory' }>('/admin/config'),
  listContributions: () => request<Contribution[]>('/admin/contributions'),
  reviewContribution: (id: string, decision: 'confirmed' | 'rejected') =>
    request<Contribution>(`/admin/contributions/${id}/review`, { method: 'POST', body: json({ decision }) }),
  createGift: (body: GiftInput) => request<Gift>('/admin/gifts', { method: 'POST', body: json(body) }),
  updateGift: (id: string, body: Partial<GiftInput> & { status?: GiftStatus }) =>
    request<Gift>(`/admin/gifts/${id}`, { method: 'PATCH', body: json(body) }),
  deleteGift: (id: string) => request(`/admin/gifts/${id}`, { method: 'DELETE' }),
  uploadImage: (file: Blob, name: string) => {
    const form = new FormData()
    form.append('file', file, name)
    return request<{ url: string }>('/admin/upload', { method: 'POST', body: form })
  },
}
