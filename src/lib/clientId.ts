const CLIENT_ID_KEY = 'tapri-client-id'

export function getClientId(): string {
  const existing = localStorage.getItem(CLIENT_ID_KEY)
  if (existing) return existing
  const id = globalThis.crypto?.randomUUID?.() ?? `client-${Date.now()}-${Math.random().toString(36).slice(2)}`
  localStorage.setItem(CLIENT_ID_KEY, id)
  return id
}
