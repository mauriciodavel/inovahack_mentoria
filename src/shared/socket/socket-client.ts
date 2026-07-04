import { io, type Socket } from 'socket.io-client'
import { APP_ORIGIN } from '../api/client'
import { getOrCreateDeviceId } from '../lib/device-id'

let socketRef: Socket | null = null

export function getSocketClient() {
	if (socketRef) return socketRef

	socketRef = io(APP_ORIGIN, {
		transports: ['websocket', 'polling'],
		withCredentials: true,
		query: {
			deviceId: getOrCreateDeviceId(),
		},
	})

	return socketRef
}
