const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

export function isStrongPassword(password: string) {
	return STRONG_PASSWORD_REGEX.test(password)
}

export function getStrongPasswordMessage() {
	return 'A nova senha deve ter pelo menos 8 caracteres, com letra maiuscula, letra minuscula, numero e caractere especial.'
}
