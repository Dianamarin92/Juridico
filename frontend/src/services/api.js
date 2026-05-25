const BASE = import.meta.env.VITE_API_URL;

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

// Auth
export const login = (username, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

// Empresas
export const getCompanies = () => request('/companies');
export const createCompany = (name) =>
  request('/companies', { method: 'POST', body: JSON.stringify({ name }) });

// Tickets
export const getTickets = (company_id) => request(`/tickets?company_id=${company_id}`);
export const createTicket = (data) =>
  request('/tickets', { method: 'POST', body: JSON.stringify(data) });
export const updateTicket = (id, data) =>
  request(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// Mensajes
export const getMessages = (ticket_id) => request(`/messages?ticket_id=${ticket_id}`);
export const sendMessage = (ticket_id, content) =>
  request('/messages', { method: 'POST', body: JSON.stringify({ ticket_id, content }) });

// Usuarios (para asignación)
export const getUsers = () => request('/users');

// Archivos
export const getFiles = (ticket_id) => request(`/files?ticket_id=${ticket_id}`);
export const uploadFile = (ticket_id, file) => {
  const form = new FormData();
  form.append('file', file);
  form.append('ticket_id', ticket_id);
  const token = localStorage.getItem('token');
  return fetch(`${BASE}/files/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  }).then((r) => r.json());
};
