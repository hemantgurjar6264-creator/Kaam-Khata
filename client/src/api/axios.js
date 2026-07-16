// client/src/api/axios.js
// Central axios instance for talking to the Express backend.
// `withCredentials: true` is essential - it makes the browser send/receive
// the HTTP-only JWT cookie on every request to the API.

import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
