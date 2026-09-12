// Security helpers for CommonGoal (BR C.4).

// Strips <> so stored text can't become HTML or a script tag, and caps length.
export function sanitiseText(value, maxLength) {
  const stripped = value.replace(/[<>]/g, '')
  return stripped.slice(0, maxLength)
}

// Same password rule the register form checks client-side, kept here for reuse.
export function isPasswordStrong(password) {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
}
