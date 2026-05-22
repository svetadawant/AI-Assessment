export function validatePayload(body: unknown): { error: string } | null {
  if (typeof body !== 'object' || body === null) {
    return { error: 'Missing or invalid field: first_name' }
  }

  const data = body as Record<string, unknown>

  for (const key of ['first_name', 'last_name', 'title'] as const) {
    if (
      typeof data[key] !== 'string' ||
      (data[key] as string).trim().length === 0 ||
      (data[key] as string).trim().length > 255
    ) {
      return { error: `Missing or invalid field: ${key}` }
    }
  }

  for (const key of ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'] as const) {
    const val = data[key]
    if (!Number.isInteger(val) || (val as number) < 1 || (val as number) > 4) {
      return { error: `Missing or invalid field: ${key}` }
    }
  }

  return null
}
