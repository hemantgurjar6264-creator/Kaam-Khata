// client/src/api/jobs.js
// Thin wrapper around the /api/jobs backend endpoints - employer job
// requirements ("I need N workers") and worker applications ("I'm
// available").

import api from './axios.js'

// ---------- Employer ----------

/** Employer: fetch requirements they've posted (with applicants). */
export async function fetchMyRequirements() {
  const { data } = await api.get('/jobs/mine')
  return data.requirements
}

/** Employer: post a new requirement. */
export async function createRequirement(payload) {
  const { data } = await api.post('/jobs', payload)
  return data.requirement
}

/** Employer: close or reopen a requirement they posted. */
export async function updateRequirementStatus(id, status) {
  const { data } = await api.patch(`/jobs/${id}/status`, { status })
  return data.requirement
}

/** Employer: delete a requirement they posted. */
export async function deleteRequirement(id) {
  await api.delete(`/jobs/${id}`)
}

/** Employer: accept or reject one worker's application. */
export async function respondToApplicant(id, workerId, status) {
  const { data } = await api.patch(`/jobs/${id}/applicants/${workerId}`, { status })
  return data.requirement
}

// ---------- Worker ----------

/** Worker: browse every currently open requirement from any employer. */
export async function fetchOpenRequirements() {
  const { data } = await api.get('/jobs/open')
  return data.requirements
}

/** Worker: requirements they've already applied to. */
export async function fetchMyApplications() {
  const { data } = await api.get('/jobs/mine/applications')
  return data.requirements
}

/** Worker: mark themselves available / request this job. */
export async function applyToRequirement(id) {
  const { data } = await api.post(`/jobs/${id}/apply`)
  return data
}

/** Worker: withdraw a pending request. */
export async function withdrawApplication(id) {
  await api.delete(`/jobs/${id}/apply`)
}
