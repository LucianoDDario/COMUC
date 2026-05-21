import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5099/api',
})

export default api
