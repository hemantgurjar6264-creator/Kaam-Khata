// client/src/utils/whatsapp.js
// Builds the wa.me deep link used to ask an employer to confirm a work
// entry. workerName now comes from the logged-in user's real profile
// (via AuthContext / GET /api/auth/me) instead of a hardcoded worker object.

export function buildWhatsAppConfirmLink(entry, workerName, confirmUrl) {
  const message =
    `Namaste, main ${workerName} aapke yahan ${entry.date} ko ${entry.hours} ghante kaam kiya tha. ` +
    `Kripya is link par confirm karein: ${confirmUrl}`
  return `https://wa.me/91${entry.employerPhone}?text=${encodeURIComponent(message)}`
}

/** Small helper to turn a Mongo id into a friendly worker-ID-looking string for display. */
export function formatWorkerCode(userId = '') {
  if (!userId) return ''
  return `KK-${userId.slice(-6).toUpperCase()}`
}
