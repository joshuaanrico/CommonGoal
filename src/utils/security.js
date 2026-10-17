// Security helpers (BR C.4).

// Removes < and > (so text can't become HTML) and cuts it to maxLength.
export function sanitiseText(value, maxLength) {
  const stripped = value.replace(/[<>]/g, '')
  return stripped.slice(0, maxLength)
}

// At least 8 characters, with a letter and a number.
export function isPasswordStrong(password) {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
}
