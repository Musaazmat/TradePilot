/** Returns a copy of the params with one key set, or removed when the value is empty. */
export function withParam(params: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(params)
  if (value) next.set(key, value)
  else next.delete(key)
  return next
}
