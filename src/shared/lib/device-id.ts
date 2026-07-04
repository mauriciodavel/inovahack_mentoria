const DEVICE_KEY = 'acomp_device_id'
const LEGACY_DEVICE_KEY = 'acomp_deviceId'

function createFallbackId() {
	return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function getOrCreateDeviceId() {
	const existing =
		localStorage.getItem(DEVICE_KEY) || localStorage.getItem(LEGACY_DEVICE_KEY)
	if (existing) return existing

	const next =
		typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID()
			: createFallbackId()

	localStorage.setItem(DEVICE_KEY, next)
	localStorage.setItem(LEGACY_DEVICE_KEY, next)
	return next
}
