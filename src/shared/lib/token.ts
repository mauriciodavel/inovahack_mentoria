const TOKEN_KEY = 'authToken'
const USER_KEY = 'currentUser'
const AUTO_FILL_KEY = 'acomp_nome_autofill'

function normalizeBase64(base64: string) {
	return base64.replace(/-/g, '+').replace(/_/g, '/')
}

function decodeTokenExp(token: string): number | null {
	try {
		const payloadBase64 = token.split('.')[1]
		if (!payloadBase64) return null

		const decoded = atob(normalizeBase64(payloadBase64))
		const payload = JSON.parse(decoded) as { exp?: number }
		return typeof payload.exp === 'number' ? payload.exp : null
	} catch {
		return null
	}
}

export function setAuthToken(token: string | null) {
	if (!token) {
		clearAuthToken()
		return
	}

	localStorage.setItem(TOKEN_KEY, token)

	const exp = decodeTokenExp(token)
	if (exp) {
		const now = Math.floor(Date.now() / 1000)
		const maxAge = exp - now
		if (maxAge > 0) {
			document.cookie = `authToken=${token}; max-age=${maxAge}; path=/`
			return
		}
	}

	document.cookie = `authToken=${token}; path=/`
}

export function getAuthToken() {
	return localStorage.getItem(TOKEN_KEY)
}

export function clearAuthToken() {
	localStorage.removeItem(TOKEN_KEY)
	localStorage.removeItem(USER_KEY)
	sessionStorage.removeItem(AUTO_FILL_KEY)
	document.cookie = 'authToken=; Max-Age=0; path=/'
}

export function hasAuthToken() {
	return Boolean(getAuthToken())
}
