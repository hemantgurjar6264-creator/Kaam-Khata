// client/src/api/work.js
// Thin wrapper around the /api/work backend endpoints. This replaces the
// old client/src/data/store.js localStorage layer entirely - every entry
// now lives in MongoDB, scoped to the logged-in user by the server.

import api from './axios.js'

/** Fetch all work entries belonging to the logged-in user. */
export async function fetchMyEntries() {
  const { data } = await api.get('/work')
  return data.entries
}

/** Fetch a single entry the logged-in user owns. */
export async function fetchEntry(id) {
  const { data } = await api.get(`/work/${id}`)
  return data.entry
}

/** Create a new work entry for the logged-in user. */
export async function createWorkEntry(payload) {
  const { data } = await api.post('/work', payload)
  return data.entry
}

/** Update a work entry the logged-in user owns. */
export async function updateWorkEntry(id, payload) {
  const { data } = await api.put(`/work/${id}`, payload)
  return data.entry
}

/** Delete a work entry the logged-in user owns. */
export async function deleteWorkEntry(id) {
  await api.delete(`/work/${id}`)
}

/**
 * Fetch an entry for the public WhatsApp confirmation page.
 * No login required - the employer confirming isn't a registered user.
 */
export async function fetchPublicEntry(id) {
  const { data } = await api.get(`/work/public/${id}`)
  return data.entry
}

/** Employer confirms or disputes an entry from the WhatsApp link. */
export async function confirmPublicEntry(id, status) {
  const { data } = await api.patch(`/work/public/${id}/status`, { status })
  return data.entry
}
