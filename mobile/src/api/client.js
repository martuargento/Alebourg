import axios from 'axios'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const API_ROOT_URL = (process.env.EXPO_PUBLIC_API_URL
  || (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000')
).replace(/\/+$/, '').replace(/\/api$/i, '')

const CLAVE_TOKEN_ADMIN = 'alebourg-admin-token'

const api = axios.create({
  baseURL: API_ROOT_URL,
  timeout: 15000,
})

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(CLAVE_TOKEN_ADMIN)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function obtenerErrorApi(error, fallback = 'Ocurrió un error. Intentá nuevamente.') {
  return error.response?.data?.error
    || error.message
    || fallback
}

export default api
