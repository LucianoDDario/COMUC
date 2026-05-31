import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
})

api.interceptors.request.use(config => {
  const stored = localStorage.getItem('comuc_user')
  if (stored) {
    const user = JSON.parse(stored)
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`
    }
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('comuc_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
