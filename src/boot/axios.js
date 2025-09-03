import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'

// Hardcoded backend base URL (sin variables de entorno)
// const baseURL = 'https://reservasmcp-production.up.railway.app/api'
const baseURL = 'http://localhost:4000/api';
const api = axios.create({ baseURL })

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
