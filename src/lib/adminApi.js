export async function adminRequest(session, path, options = {}) {
  if (!session) {
    throw new Error('Missing admin session');
  }

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(`${session.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${session.token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Admin API failed: ${response.status}`);
  }

  return response.json();
}

export const unwrapData = result => result?.data || {};
