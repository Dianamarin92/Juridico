import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import LandingPage from './LandingPage';
import * as api from './services/api';

const ROLE_LABELS = {
  cliente:           'Cliente',
  abogada_asignada:  'Abogada Asignada',
  abogada_lider:     'Abogada Líder',
  steven_marin:      'Steven Marín',
};

const STATUS_INFO = {
  pending:  { text: 'Pendiente',   cls: 'status-pending' },
  progress: { text: 'En Proceso',  cls: 'status-progress' },
  review:   { text: 'En Revisión', cls: 'status-review' },
  done:     { text: 'Enviado',     cls: 'status-done' },
};

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [user, setUser]               = useState(null);

  const [companies, setCompanies]     = useState([]);
  const [tickets, setTickets]         = useState([]);
  const [messages, setMessages]       = useState([]);
  const [files, setFiles]             = useState([]);
  const [lawyers, setLawyers]         = useState([]);

  const [currentView, setCurrentView]       = useState('dashboard');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedTicket, setSelectedTicket]   = useState(null);

  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError]       = useState('');

  const [chatInput, setChatInput]         = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTicketTitle, setNewTicketTitle]   = useState('');
  const [newTicketDesc, setNewTicketDesc]     = useState('');
  const [newTicketFiles, setNewTicketFiles]   = useState([]);

  const chatEndRef = useRef(null);

  const isLoggedIn = !!user;
  const role       = user?.role;
  const isCliente  = role === 'cliente';

  useEffect(() => {
    if (!isLoggedIn) return;

    if (isCliente) {
      const cid = Number(user.company_id);
      // Cliente va directo a sus tickets
      setCurrentView('companyDetail');
      setSelectedCompany({ id: cid, name: 'Mis Casos' });
      setLoading(true);
      api.getTickets(cid)
        .then(setTickets)
        .catch(() => setError('Error al cargar tickets'))
        .finally(() => setLoading(false));
      // Cargar nombre real de empresa en paralelo
      api.getCompanies()
        .then(data => {
          const mine = data.find(c => Number(c.id) === cid);
          if (mine) setSelectedCompany(mine);
        })
        .catch(() => {});
    } else {
      api.getCompanies()
        .then(setCompanies)
        .catch(() => setError('Error al cargar empresas'));
      api.getUsers().then(setLawyers).catch(() => {});
    }
  }, [isLoggedIn]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const data = await api.login(loginUsername, loginPassword);
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCompanies([]); setTickets([]); setMessages([]); setFiles([]);
    setSelectedCompany(null); setSelectedTicket(null);
    setCurrentView('dashboard');
    setShowLanding(true);
  };

  const openCompany = async (company) => {
    setSelectedCompany(company);
    setCurrentView('companyDetail');
    setLoading(true);
    try {
      setTickets(await api.getTickets(company.id));
    } catch {
      setError('Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  };

  const openTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setCurrentView('ticketDetail');
    setLoading(true);
    try {
      const [msgs, fls] = await Promise.all([
        api.getMessages(ticket.id),
        api.getFiles(ticket.id),
      ]);
      setMessages(msgs);
      setFiles(fls);
    } catch {
      setError('Error al cargar ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      await api.sendMessage(selectedTicket.id, chatInput);
      setChatInput('');
      setMessages(await api.getMessages(selectedTicket.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicketTitle.trim()) return;
    try {
      const ticket = await api.createTicket({ company_id: selectedCompany.id, title: newTicketTitle, description: newTicketDesc });
      // Enviar descripción como primer mensaje en el hilo
      if (newTicketDesc.trim()) {
        await api.sendMessage(ticket.id, newTicketDesc.trim());
      }
      // Subir archivos adjuntos si hay
      for (const file of newTicketFiles) {
        await api.uploadFile(ticket.id, file);
      }
      setIsCreateModalOpen(false);
      setNewTicketTitle(''); setNewTicketDesc(''); setNewTicketFiles([]);
      setTickets(await api.getTickets(selectedCompany.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangeStatus = async (newStatus) => {
    try {
      await api.updateTicket(selectedTicket.id, { status: newStatus, assigned_to: selectedTicket.assigned_to });
      setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      setTickets(await api.getTickets(selectedCompany.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangeAssignment = async (newAssignedId) => {
    try {
      await api.updateTicket(selectedTicket.id, { status: selectedTicket.status, assigned_to: newAssignedId || null });
      const lawyer = lawyers.find(l => l.id === parseInt(newAssignedId));
      setSelectedTicket(prev => ({ ...prev, assigned_to: newAssignedId || null, assigned_email: lawyer?.email || null }));
      setTickets(await api.getTickets(selectedCompany.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm('¿Seguro que deseas eliminar este ticket? Esta acción no se puede deshacer.')) return;
    try {
      await api.deleteTicket(selectedTicket.id);
      setSelectedTicket(null);
      setCurrentView('companyDetail');
      setTickets(await api.getTickets(selectedCompany.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await api.uploadFile(selectedTicket.id, file);
      setFiles(await api.getFiles(selectedTicket.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusInfo = (status) => STATUS_INFO[status] || { text: 'Desconocido', cls: '' };

  // ── LANDING ──────────────────────────────────────────
  if (!isLoggedIn && showLanding) {
    return <LandingPage onLogin={() => setShowLanding(false)} />;
  }

  // ── LOGIN ─────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <img src="/logo.jpg" alt="Marin & Abogados" style={{ maxHeight: '80px', marginBottom: '1rem', objectFit: 'contain' }} />
          <h1 style={{ margin: '0 0 0.25rem', color: 'var(--primary-color)' }}>Marin & Abogados</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Portal de Gestión Jurídica</p>
          <button onClick={() => setShowLanding(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.8rem', margin: '0.5rem 0', fontFamily: 'inherit' }}>
            ← Volver al sitio web
          </button>

          {loginError && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', width: '100%' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            <div className="login-input-group">
              <label>Usuario (Cédula / NIT)</label>
              <input
                type="text"
                placeholder="Ej. 1234567890"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                required
              />
            </div>
            <div className="login-input-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary login-btn">
              Ingresar al Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── APP ───────────────────────────────────────────────
  return (
    <div className="app-container">
      {error && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', background: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', zIndex: 200, fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(0,0,0,.15)' }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', marginLeft: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-title">
          <img src="/logo.jpg" alt="Marin & Abogados" style={{ maxHeight: '32px', objectFit: 'contain' }} />
          Marin & Abogados
        </div>

        {!isCliente ? (
          <div className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
            Directorio de Empresas
          </div>
        ) : (
          <div className={`nav-link ${currentView !== 'dashboard' ? 'active' : ''}`} onClick={() => selectedCompany && openCompany(selectedCompany)}>
            Mis Tickets
          </div>
        )}
        <div className="nav-link">Documentos Plantilla</div>
        {role === 'steven_marin' && (
          <div className={`nav-link ${currentView === 'reports' ? 'active' : ''}`} onClick={() => setCurrentView('reports')}>
            Informes
          </div>
        )}

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{user.username}</p>
          <span className="role-badge">{ROLE_LABELS[role] || role}</span>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        <header className="topbar">
          <div className="search-bar" style={{ color: '#a3a3a3' }}>
            Gestión Centralizada — {ROLE_LABELS[role] || role}
          </div>
          <div className="user-info">
            <span className="role-badge">{ROLE_LABELS[role] || role}</span>
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {(user.username || '?').charAt(0).toUpperCase()}
            </div>
            <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', marginLeft: '0.5rem' }} onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        </header>

        <section className="content-area">

          {/* DASHBOARD — solo para roles administrativos */}
          {currentView === 'dashboard' && !isCliente && (
            <>
              <div className="view-header">
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Directorio de Empresas</h1>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>Estado general de casos por cliente.</p>
                </div>
              </div>
              {loading ? <p style={{ color: 'var(--text-muted)' }}>Cargando...</p> : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Empresa Cliente</th>
                        <th style={{ textAlign: 'center' }}>Pendientes</th>
                        <th style={{ textAlign: 'center' }}>En Proceso</th>
                        <th style={{ textAlign: 'center' }}>En Revisión</th>
                        <th style={{ textAlign: 'center' }}>Enviados</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map(company => (
                        <tr key={company.id} onClick={() => openCompany(company)}>
                          <td><div className="company-name-cell">{company.name}</div></td>
                          <td style={{ textAlign: 'center' }}><span style={{ color: 'var(--text-muted)' }}>—</span></td>
                          <td style={{ textAlign: 'center' }}><span style={{ color: 'var(--text-muted)' }}>—</span></td>
                          <td style={{ textAlign: 'center' }}><span style={{ color: 'var(--text-muted)' }}>—</span></td>
                          <td style={{ textAlign: 'center' }}><span style={{ color: 'var(--text-muted)' }}>—</span></td>
                          <td><button className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Ver Detalle →</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* INFORMES */}
          {currentView === 'reports' && (
            <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
              <h2>Módulo de Informes</h2>
              <p>Esta sección está en construcción.</p>
            </div>
          )}

          {/* DETALLE EMPRESA */}
          {currentView === 'companyDetail' && selectedCompany && (
            <>
              {isCliente ? (
                /* ── VISTA CLIENTE ─────────────────────────────── */
                <>
                  <div className="view-header">
                    <div>
                      <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Mis Tickets</h1>
                      <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>Seguimiento de sus tickets jurídicos.</p>
                    </div>
                    <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>+ Nuevo Ticket</button>
                  </div>

                  {loading ? <p style={{ color: 'var(--text-muted)' }}>Cargando...</p> : (
                    <>
                      {/* Resumen de estados */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                        {[
                          { key: 'pending',  label: 'Pendientes',  cls: 'status-pending' },
                          { key: 'progress', label: 'En Proceso',  cls: 'status-progress' },
                          { key: 'review',   label: 'En Revisión', cls: 'status-review' },
                          { key: 'done',     label: 'Enviados',    cls: 'status-done' },
                        ].map(({ key, label, cls }) => (
                          <div key={key} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1rem 1.25rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                              {tickets.filter(t => t.status === key).length}
                            </div>
                            <span className={`count-badge ${cls}`} style={{ marginTop: '0.25rem', display: 'inline-block' }}>{label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Lista de casos */}
                      {tickets.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', background: 'var(--surface-color)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Aún no tiene tickets registrados.</p>
                          <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>+ Crear primer ticket</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {tickets.map(ticket => {
                            const status = getStatusInfo(ticket.status);
                            return (
                              <div
                                key={ticket.id}
                                onClick={() => openTicket(ticket)}
                                style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', minWidth: '2.5rem' }}>#{ticket.id}</span>
                                  <div>
                                    <div style={{ fontWeight: '600', color: 'var(--primary-color)', marginBottom: '0.2rem' }}>{ticket.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(ticket.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                  <span className={`count-badge ${status.cls}`}>{status.text}</span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>›</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                /* ── VISTA ADMIN ────────────────────────────────── */
                <>
                  <div className="view-header">
                    <div>
                      <button className="btn-secondary" onClick={() => setCurrentView('dashboard')} style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        ← Volver a Empresas
                      </button>
                      <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedCompany.name}</h1>
                      <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>Tickets asociados a esta empresa.</p>
                    </div>
                  </div>

                  {loading ? <p style={{ color: 'var(--text-muted)' }}>Cargando tickets...</p> : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Asignado a</th>
                            <th>Asunto</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No hay tickets aún.</td></tr>
                          )}
                          {tickets.map(ticket => {
                            const status = getStatusInfo(ticket.status);
                            return (
                              <tr key={ticket.id} onClick={() => openTicket(ticket)}>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>#{ticket.id}</td>
                                <td style={{ color: 'var(--text-muted)' }}>{ticket.assigned_email || 'Sin asignar'}</td>
                                <td style={{ fontWeight: '500', color: 'var(--primary-color)' }}>{ticket.title}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{new Date(ticket.created_at).toLocaleDateString('es-CO')}</td>
                                <td><span className={`count-badge ${status.cls}`}>{status.text}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* DETALLE TICKET */}
          {currentView === 'ticketDetail' && selectedTicket && (
            <>
              <div className="view-header">
                <div>
                  <button className="btn-secondary" onClick={() => setCurrentView('companyDetail')} style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    ← Volver a Tickets
                  </button>
                  <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedTicket.title}</h1>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>{selectedCompany?.name} | Ref: #{selectedTicket.id}</p>
                  {isCliente && selectedTicket.status === 'pending' && (
                    <button
                      onClick={handleDeleteTicket}
                      style={{ marginTop: '0.75rem', background: 'none', border: '1px solid #dc2626', color: '#dc2626', borderRadius: '0.5rem', padding: '0.35rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Eliminar ticket
                    </button>
                  )}
                </div>
                {!isCliente && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontWeight: '500' }}>Estado:</label>
                    <select
                      value={selectedTicket.status}
                      onChange={e => handleChangeStatus(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontWeight: 'bold' }}
                      className={`count-badge status-${selectedTicket.status}`}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="progress">En Proceso</option>
                      <option value="review">En Revisión</option>
                      <option value="done">Enviado</option>
                    </select>
                  </div>
                )}
              </div>

              {loading ? <p style={{ color: 'var(--text-muted)' }}>Cargando...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                  {/* CHAT */}
                  <div className="chat-container" style={{ height: '500px' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', fontWeight: '600' }}>
                      Hilo de Comunicación
                    </div>
                    <div className="chat-messages">
                      {messages.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay mensajes aún.</p>}
                      {messages.map(msg => {
                        const isMine = msg.sender_id === user.id;
                        return (
                          <div key={msg.id} className={`message ${isMine ? 'sent' : 'received'}`}>
                            <div className="message-sender">{msg.sender_email}</div>
                            <div>{msg.content}</div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                    <form className="chat-input" onSubmit={handleSendMessage}>
                      {!isCliente && (
                        <label className="btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                          📎
                          <input type="file" hidden onChange={handleUploadFile} />
                        </label>
                      )}
                      <input
                        type="text"
                        placeholder="Escribe un mensaje..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                      />
                      <button type="submit" className="btn-primary">Enviar</button>
                    </form>
                  </div>

                  {/* PANEL LATERAL */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                      <h3 style={{ marginTop: 0 }}>Información</h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                        <strong>Estado:</strong>{' '}
                        <span className={`count-badge ${getStatusInfo(selectedTicket.status).cls}`} style={{ display: 'inline-flex', marginLeft: '0.5rem' }}>
                          {getStatusInfo(selectedTicket.status).text}
                        </span>
                      </p>
                      {!isCliente && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.75rem 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong>Asignado a:</strong>
                          <select
                            value={selectedTicket.assigned_to || ''}
                            onChange={e => handleChangeAssignment(e.target.value)}
                            style={{ padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                          >
                            <option value="">Sin asignar</option>
                            {lawyers.map(l => (
                              <option key={l.id} value={l.id}>{l.email}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>Adjuntos</h3>
                        {isCliente && (
                          <label className="btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                            📎 Subir
                            <input type="file" hidden onChange={handleUploadFile} />
                          </label>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {files.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Sin archivos adjuntos.</p>}
                        {files.map(f => (
                          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'var(--bg-color)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                            📄 {f.filename}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* MODAL CREAR TICKET */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '1rem', width: '500px', maxWidth: '90%', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginTop: 0, color: 'var(--primary-color)' }}>Nuevo Ticket</h2>
            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Asunto</label>
                <input
                  type="text"
                  value={newTicketTitle}
                  onChange={e => setNewTicketTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                  placeholder="Ej. Revisión de contrato laboral..."
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Descripción</label>
                <textarea
                  value={newTicketDesc}
                  onChange={e => setNewTicketDesc(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', minHeight: '100px' }}
                  placeholder="Describe detalladamente lo que necesitas..."
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Documentos adjuntos <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(opcional)</span></label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', border: '2px dashed var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  📎 Seleccionar archivos
                  <input
                    type="file"
                    multiple
                    hidden
                    onChange={e => setNewTicketFiles(prev => [...prev, ...Array.from(e.target.files)])}
                  />
                </label>
                {newTicketFiles.length > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {newTicketFiles.map((f, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📄 {f.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn-secondary" onClick={() => { setIsCreateModalOpen(false); setNewTicketFiles([]); }}>Cancelar</button>
                <button type="submit" className="btn-primary">Enviar Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
