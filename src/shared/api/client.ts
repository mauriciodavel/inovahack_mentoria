import { clearAuthToken, getAuthToken } from '../lib/token'

const DEFAULT_APP_PORT = '3000'
const ENV_API_URL = import.meta.env.VITE_API_URL as string | undefined

function getAppOrigin() {
	if (ENV_API_URL) return ENV_API_URL

	const { protocol, hostname, origin, port } = window.location
	if (port === DEFAULT_APP_PORT) return origin
	return `${protocol}//${hostname}:${DEFAULT_APP_PORT}`
}

export const APP_ORIGIN = getAppOrigin()

function buildUrl(url: string) {
	if (/^https?:\/\//i.test(url)) return url
	return new URL(url, APP_ORIGIN).toString()
}

export async function apiFetch(url: string, options: RequestInit = {}) {
	const token = getAuthToken()
	const headers = new Headers(options.headers)

	if (!headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json')
	}

	if (token) {
		headers.set('Authorization', `Bearer ${token}`)
	}

	const response = await fetch(buildUrl(url), {
		...options,
		headers,
		credentials: 'include',
	})

	if (response.status === 401) {
		clearAuthToken()
	}

	return response
}

export function apiGet(url: string) {
	return apiFetch(url, { method: 'GET' })
}

export function apiPost<TBody>(url: string, body: TBody) {
	return apiFetch(url, {
		method: 'POST',
		body: JSON.stringify(body),
	})
}

export function apiPut<TBody>(url: string, body: TBody) {
	return apiFetch(url, {
		method: 'PUT',
		body: JSON.stringify(body),
	})
}

export function apiDelete(url: string) {
	return apiFetch(url, { method: 'DELETE' })
}
