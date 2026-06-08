import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import LandingPage from './LandingPage';
import * as api from './services/api';

const ROLE_LABELS = {
  cliente:           'Cliente',
  abogada_asignada:  'Abogada Asignada',
  abogada_lider:     'Abogada Líder',
  steven_marin:      'Admin',
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
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState('');

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError]       = useState('');

  const [chatInput, setChatInput]         = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTicketTitle, setNewTicketTitle]   = useState('');
  const [newTicketDesc, setNewTicketDesc]     = useState('');
  const [newTicketFiles, setNewTicketFiles]   = useState([]);

  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', nit: '', contact_name: '', phone: '', email: '', username: '', password: '' });

  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', name: '', email: '', password: '', role: 'abogada_asignada' });
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 5 * 1024 * 1024 * 1024 });
  const [adminPassword, setAdminPassword] = useState('');

  const [editCompany, setEditCompany] = useState({ name: '', nit: '', contact_name: '', phone: '', email: '' });
  const [editPassword, setEditPassword] = useState('');

  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', role: '', password: '' });

  const [profileCompany, setProfileCompany] = useState(null);
  const [companyFiles, setCompanyFiles] = useState([]);
  const [editingProfileCompany, setEditingProfileCompany] = useState(false);
  const [profileCompanyEdit, setProfileCompanyEdit] = useState({ name: '', nit: '', contact_name: '', phone: '', email: '' });
  const [companyFilesLoading, setCompanyFilesLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const [reportCompany, setReportCompany] = useState('all');
  const [reportPeriod, setReportPeriod]   = useState('month');
  const [reportValue, setReportValue]     = useState('3');
  const [reportData, setReportData]       = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError]     = useState('');

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
      api.getStorage().then(setStorageInfo).catch(() => {});
    }
  }, [isLoggedIn]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setBusy(true);
    try {
      const data = await api.login(loginUsername, loginPassword);
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCompanies([]); setTickets([]); setMessages([]); setFiles([]);
    setSelectedCompany(null); setSelectedTicket(null);
    setCurrentView('dashboard');
    setShowLanding(false);
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
      if (!isCliente && ticket.is_new) {
        api.markTicketRead(ticket.id).catch(() => {});
        setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, is_new: 0 } : t));
      }
    } catch {
      setError('Error al cargar ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setBusy(true);
    try {
      await api.sendMessage(selectedTicket.id, chatInput);
      setChatInput('');
      setMessages(await api.getMessages(selectedTicket.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicketTitle.trim()) return;
    setBusy(true);
    try {
      const ticket = await api.createTicket({ company_id: selectedCompany.id, title: newTicketTitle, description: newTicketDesc });
      if (newTicketDesc.trim()) await api.sendMessage(ticket.id, newTicketDesc.trim());
      for (const file of newTicketFiles) await api.uploadFile(ticket.id, file);
      setIsCreateModalOpen(false);
      setNewTicketTitle(''); setNewTicketDesc(''); setNewTicketFiles([]);
      setTickets(await api.getTickets(selectedCompany.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleChangeStatus = async (newStatus) => {
    setBusy(true);
    try {
      await api.updateTicket(selectedTicket.id, { status: newStatus, assigned_to: selectedTicket.assigned_to, is_new: false });
      setSelectedTicket(prev => ({ ...prev, status: newStatus, is_new: 0 }));
      setTickets(await api.getTickets(selectedCompany.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleChangeAssignment = async (newAssignedId) => {
    setBusy(true);
    try {
      await api.updateTicket(selectedTicket.id, { status: selectedTicket.status, assigned_to: newAssignedId || null });
      const lawyer = lawyers.find(l => l.id === parseInt(newAssignedId));
      setSelectedTicket(prev => ({ ...prev, assigned_to: newAssignedId || null, assigned_email: lawyer?.email || null, assigned_name: lawyer?.name || null }));
      setTickets(await api.getTickets(selectedCompany.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createCompany(newCompany);
      setIsCreateCompanyOpen(false);
      setNewCompany({ name: '', nit: '', contact_name: '', phone: '', email: '', username: '', password: '' });
      setCompanies(await api.getCompanies());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCompany = async (company) => {
    if (!window.confirm(`¿Eliminar "${company.name}"? Se borrarán todos sus tickets y el usuario cliente.`)) return;
    setBusy(true);
    try {
      await api.deleteCompany(company.id);
      setCompanies(await api.getCompanies());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openEditProfile = () => {
    setEditCompany({
      name:         selectedCompany?.name         || '',
      nit:          selectedCompany?.nit           || '',
      contact_name: selectedCompany?.contact_name  || '',
      phone:        selectedCompany?.phone         || '',
      email:        selectedCompany?.email         || '',
    });
    setEditPassword('');
    setCurrentView('profile');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.updateCompany(selectedCompany.id, editCompany);
      if (editPassword) await api.updateMyPassword(editPassword);
      setSelectedCompany(prev => ({ ...prev, ...editCompany }));
      setEditPassword('');
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createUser(newUser);
      setIsCreateUserOpen(false);
      setNewUser({ username: '', name: '', email: '', password: '', role: 'abogada_asignada' });
      setLawyers(await api.getUsers());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveProfileCompany = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.updateCompany(profileCompany.id, profileCompanyEdit);
      const updated = { ...profileCompany, ...profileCompanyEdit };
      setProfileCompany(updated);
      setCompanies(prev => prev.map(c => c.id === updated.id ? { ...c, ...profileCompanyEdit } : c));
      setEditingProfileCompany(false);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const openCompanyProfile = async (company) => {
    setProfileCompany(company);
    setCompanyFilesLoading(true);
    try {
      setCompanyFiles(await api.getCompanyFiles(company.id));
    } catch { setCompanyFiles([]); }
    finally { setCompanyFilesLoading(false); }
  };

  const handleUploadCompanyFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !profileCompany) return;
    setBusy(true);
    try {
      await api.uploadCompanyFile(profileCompany.id, file);
      setCompanyFiles(await api.getCompanyFiles(profileCompany.id));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); e.target.value = ''; }
  };

  const handleDeleteCompanyFile = async (fileId) => {
    if (!window.confirm('¿Eliminar este archivo?')) return;
    setBusy(true);
    try {
      await api.deleteFile(fileId);
      setCompanyFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const handleToggleCompany = async (company) => {
    const accion = company.is_active ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Seguro que deseas ${accion} la empresa "${company.name}"?`)) return;
    setBusy(true);
    try {
      await api.toggleCompanyActive(company.id, !company.is_active);
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, is_active: !c.is_active } : c));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {};
      if (editUserForm.name !== undefined) payload.name = editUserForm.name;
      if (editUserForm.email !== undefined) payload.email = editUserForm.email;
      if (editUserForm.role) payload.role = editUserForm.role;
      if (editUserForm.password) payload.password = editUserForm.password;
      await api.updateUser(editingUser.id, payload);
      setEditingUser(null);
      setLawyers(await api.getUsers());
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const handleToggleUser = async (u) => {
    setBusy(true);
    try {
      await api.toggleUserActive(u.id, !u.is_active);
      setLawyers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: x.is_active ? 0 : 1 } : x));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el usuario "${u.name || u.username}"? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    try {
      await api.deleteUser(u.id);
      setLawyers(prev => prev.filter(x => x.id !== u.id));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const handleSaveAdminPassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.updateMyPassword(adminPassword);
      setAdminPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleDeleteFile = async (fileId) => {
    setBusy(true);
    try {
      await api.deleteFile(fileId);
      setFiles(await api.getFiles(selectedTicket.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm('¿Seguro que deseas eliminar este ticket? Esta acción no se puede deshacer.')) return;
    setBusy(true);
    try {
      await api.deleteTicket(selectedTicket.id);
      setSelectedTicket(null);
      setCurrentView('companyDetail');
      setTickets(await api.getTickets(selectedCompany.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    try {
      await api.uploadFile(selectedTicket.id, file);
      setFiles(await api.getFiles(selectedTicket.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
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
        {busy && <div className="loading-bar" />}
        <div className="login-card">
          <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Marin & Abogados" style={{ maxHeight: '160px', marginBottom: '1.5rem', objectFit: 'contain' }} />
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
      {(loading || busy) && <div className="loading-bar" />}
      {error && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', background: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', zIndex: 200, fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(0,0,0,.15)' }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', marginLeft: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-title">
          <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Marin & Abogados" style={{ maxHeight: '80px', width: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
        </div>

        {!isCliente ? (
          <>
            <div className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
              Directorio de Empresas
            </div>
            <div className={`nav-link ${currentView === 'companyProfiles' ? 'active' : ''}`} onClick={() => { setProfileCompany(null); setCurrentView('companyProfiles'); }}>
              Perfil Empresa
            </div>
            {(role === 'steven_marin' || role === 'abogada_lider') && (
              <div className={`nav-link ${currentView === 'usersManagement' ? 'active' : ''}`} onClick={() => setCurrentView('usersManagement')}>
                Usuarios del Sistema
              </div>
            )}
            <div className={`nav-link ${currentView === 'adminProfile' ? 'active' : ''}`} onClick={() => { setAdminPassword(''); setCurrentView('adminProfile'); }}>
              Mi Perfil
            </div>
          </>
        ) : (
          <>
            <div className={`nav-link ${currentView === 'companyDetail' ? 'active' : ''}`} onClick={() => selectedCompany && openCompany(selectedCompany)}>
              Mis Tickets
            </div>
            <div className={`nav-link ${currentView === 'profile' ? 'active' : ''}`} onClick={openEditProfile}>
              Mi Perfil
            </div>
          </>
        )}
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
            {isCliente && selectedCompany?.name && (
              <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.95rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedCompany.name}
              </span>
            )}
            <span className="role-badge">{user.name || user.username}</span>
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
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn-secondary" onClick={() => setIsCreateUserOpen(true)}>+ Nuevo Usuario</button>
                  <button className="btn-primary" onClick={() => setIsCreateCompanyOpen(true)}>+ Nueva Empresa</button>
                </div>
              </div>
              {loading ? (
                <div className="spinner-wrapper"><div className="spinner" /><span>Cargando empresas...</span></div>
              ) : (
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
                      {companies.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No hay empresas registradas.</td></tr>
                      )}
                      {companies.filter(c => role === 'steven_marin' || c.is_active !== 0).map(company => {
                        const active = company.is_active !== 0;
                        return (
                        <tr key={company.id} style={{ background: active ? '' : '#fef2f2', opacity: active ? 1 : 0.85 }}>
                          <td onClick={() => openCompany(company)} style={{ cursor: 'pointer' }}>
                            <div className="company-name-cell">
                              <span style={{ color: active ? 'var(--primary-color)' : '#9ca3af', textDecoration: active ? 'none' : 'line-through' }}>{company.name}</span>
                              {!active && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: '#fee2e2', color: '#b91c1c', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: '600' }}>Desactivada</span>}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {company.pending_count > 0
                              ? <span className="count-badge status-pending">{company.pending_count}</span>
                              : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {company.progress_count > 0
                              ? <span className="count-badge status-progress">{company.progress_count}</span>
                              : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {company.review_count > 0
                              ? <span className="count-badge status-review">{company.review_count}</span>
                              : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {company.done_count > 0
                              ? <span className="count-badge status-done">{company.done_count}</span>
                              : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button className="btn-secondary" onClick={() => openCompany(company)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Ver →</button>
                            {role === 'steven_marin' && (
                              <button
                                onClick={() => handleToggleCompany(company)}
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '0.4rem', cursor: 'pointer', fontWeight: '600', border: 'none', background: active ? '#fef3c7' : '#10b981', color: active ? '#b45309' : '#ffffff' }}
                              >{active ? 'Desactivar' : 'Activar'}</button>
                            )}
                            {role === 'steven_marin' && (
                              <button onClick={() => handleDeleteCompany(company)} style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: 'none', border: '1px solid #dc2626', color: '#dc2626', borderRadius: '0.4rem', cursor: 'pointer' }}>Eliminar</button>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* USUARIOS DEL SISTEMA */}
          {currentView === 'usersManagement' && (role === 'steven_marin' || role === 'abogada_lider') && (
            <div>
              <div className="view-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Usuarios del Sistema</h1>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>Gestiona los usuarios administrativos del portal.</p>
                </div>
                <button className="btn-primary" onClick={() => setIsCreateUserOpen(true)}>+ Nuevo Usuario</button>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Cédula</th>
                      <th>Correo</th>
                      <th style={{ textAlign: 'center' }}>Rol</th>
                      <th style={{ textAlign: 'center' }}>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lawyers.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No hay usuarios registrados.</td></tr>
                    )}
                    {lawyers.map(u => {
                      const active = u.is_active !== 0;
                      return (
                        <tr key={u.id} style={{ opacity: active ? 1 : 0.55 }}>
                          <td style={{ fontWeight: '600' }}>{u.name || '—'}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{u.username}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{u.email || '—'}</td>
                          <td style={{ textAlign: 'center' }}><span className="role-badge" style={{ whiteSpace: 'nowrap' }}>{ROLE_LABELS[u.role] || u.role}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            {active
                              ? <span style={{ background: '#d1fae5', color: '#065f46', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' }}>Activo</span>
                              : <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' }}>Inactivo</span>}
                          </td>
                          <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              className="btn-secondary"
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                              onClick={() => { setEditingUser(u); setEditUserForm({ name: u.name || '', email: u.email || '', role: u.role, password: '' }); }}
                            >Editar</button>
                            {u.id !== user.id && (
                              <button
                                onClick={() => handleToggleUser(u)}
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: 'none', border: `1px solid ${active ? '#f59e0b' : '#10b981'}`, color: active ? '#b45309' : '#059669', borderRadius: '0.4rem', cursor: 'pointer' }}
                              >{active ? 'Desactivar' : 'Activar'}</button>
                            )}
                            {role === 'steven_marin' && u.id !== user.id && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: 'none', border: '1px solid #dc2626', color: '#dc2626', borderRadius: '0.4rem', cursor: 'pointer' }}
                              >Eliminar</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INFORMES */}
          {currentView === 'reports' && (
            <div style={{ maxWidth: '900px' }}>
              <div className="view-header" style={{ marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Informes</h1>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>Consulta la actividad de tickets por empresa y período.</p>
                </div>
              </div>

              {/* Filtros */}
              <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '200px', flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Empresa</label>
                  <select value={reportCompany} onChange={e => setReportCompany(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                    <option value="all">Todas las empresas</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Período</label>
                  <select value={reportPeriod} onChange={e => setReportPeriod(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                    <option value="day">Días</option>
                    <option value="month">Meses</option>
                    <option value="year">Años</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                    Últimos {reportPeriod === 'day' ? 'días' : reportPeriod === 'month' ? 'meses' : 'años'}
                  </label>
                  <input type="number" min="1" max="100" value={reportValue}
                    onChange={e => setReportValue(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.9rem', width: '80px' }} />
                </div>

                <button
                  className="btn-primary"
                  disabled={reportLoading}
                  onClick={async () => {
                    setReportLoading(true);
                    setReportError('');
                    setReportData(null);
                    try {
                      const data = await api.getTicketReport(reportCompany, reportPeriod, reportValue);
                      setReportData(data);
                    } catch (err) {
                      setReportError(err.message);
                    } finally {
                      setReportLoading(false);
                    }
                  }}
                  style={{ alignSelf: 'flex-end' }}
                >
                  {reportLoading ? 'Consultando...' : 'Generar informe'}
                </button>
              </div>

              {reportError && <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{reportError}</p>}

              {reportLoading && (
                <div className="spinner-wrapper"><div className="spinner" /><span>Generando informe...</span></div>
              )}

              {/* Resultado: todas las empresas */}
              {reportData && reportData.byCompany && (
                <div style={{ background: 'var(--surface-color)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <strong>Tickets por empresa — últimos {reportValue} {reportPeriod === 'day' ? 'días' : reportPeriod === 'month' ? 'meses' : 'años'}</strong>
                  </div>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Empresa</th>
                        <th style={{ textAlign: 'center' }}>Total</th>
                        <th style={{ textAlign: 'center' }}>Pendientes</th>
                        <th style={{ textAlign: 'center' }}>En Proceso</th>
                        <th style={{ textAlign: 'center' }}>En Revisión</th>
                        <th style={{ textAlign: 'center' }}>Enviados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.byCompany.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Sin resultados para el período seleccionado.</td></tr>
                      )}
                      {reportData.byCompany.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: '500' }}>{row.company_name}</td>
                          <td style={{ textAlign: 'center' }}><span className="count-badge" style={{ background: '#e0e7ff', color: '#3730a3', minWidth: '28px', display: 'inline-block' }}>{row.total}</span></td>
                          <td style={{ textAlign: 'center' }}><span className="count-badge status-pending">{row.pending || 0}</span></td>
                          <td style={{ textAlign: 'center' }}><span className="count-badge status-progress">{row.in_progress || 0}</span></td>
                          <td style={{ textAlign: 'center' }}><span className="count-badge status-review">{row.in_review || 0}</span></td>
                          <td style={{ textAlign: 'center' }}><span className="count-badge status-done">{row.sent || 0}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Resultado: empresa específica */}
              {reportData && reportData.summary && (
                <>
                  {/* Tarjetas resumen */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                      { label: 'Total', value: reportData.summary.total, bg: '#e0e7ff', color: '#3730a3' },
                      { label: 'Pendientes', value: reportData.summary.pending || 0, bg: '#fee2e2', color: '#b91c1c' },
                      { label: 'En Proceso', value: reportData.summary.in_progress || 0, bg: '#fef3c7', color: '#b45309' },
                      { label: 'En Revisión', value: reportData.summary.in_review || 0, bg: '#ede9fe', color: '#6d28d9' },
                      { label: 'Enviados', value: reportData.summary.sent || 0, bg: '#d1fae5', color: '#065f46' },
                    ].map(card => (
                      <div key={card.label} style={{ background: card.bg, borderRadius: '1rem', padding: '1.25rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: card.color }}>{card.value}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: card.color, marginTop: '0.25rem' }}>{card.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tabla detalle */}
                  <div style={{ background: 'var(--surface-color)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                      <strong>Detalle de tickets — últimos {reportValue} {reportPeriod === 'day' ? 'días' : reportPeriod === 'month' ? 'meses' : 'años'}</strong>
                    </div>
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Asunto</th>
                          <th>Asignado a</th>
                          <th>Fecha</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.tickets.length === 0 && (
                          <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Sin tickets en el período seleccionado.</td></tr>
                        )}
                        {reportData.tickets.map(t => {
                          const st = getStatusInfo(t.status);
                          return (
                            <tr key={t.id}>
                              <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>#{t.id}</td>
                              <td style={{ fontWeight: '500' }}>{t.title}</td>
                              <td style={{ color: 'var(--text-muted)' }}>{t.assigned_name || t.assigned_email || 'Sin asignar'}</td>
                              <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{new Date(t.created_at).toLocaleDateString('es-CO')}</td>
                              <td><span className={`count-badge ${st.cls}`}>{st.text}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* PERFIL CLIENTE */}
          {currentView === 'profile' && isCliente && (
            <div style={{ maxWidth: '600px' }}>
              <div className="view-header" style={{ marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Mi Perfil</h1>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>Actualiza los datos de tu empresa y contraseña de acceso.</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Datos de empresa */}
                <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: 'var(--primary-color)', fontSize: '1rem' }}>Datos de la Empresa</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      { field: 'name',         label: 'Nombre de la empresa', required: true },
                      { field: 'nit',          label: 'NIT' },
                      { field: 'contact_name', label: 'Persona de contacto' },
                      { field: 'phone',        label: 'Teléfono' },
                      { field: 'email',        label: 'Correo electrónico' },
                    ].map(({ field, label, required }) => (
                      <div key={field}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>
                          {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
                        </label>
                        <input
                          type="text"
                          value={editCompany[field]}
                          onChange={e => setEditCompany(prev => ({ ...prev, [field]: e.target.value }))}
                          required={required}
                          style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cambiar contraseña */}
                <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: 'var(--primary-color)', fontSize: '1rem' }}>Cambiar Contraseña</h3>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>
                      Nueva contraseña <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(dejar vacío para no cambiar)</span>
                    </label>
                    <input
                      type="password"
                      value={editPassword}
                      onChange={e => setEditPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setCurrentView('companyDetail')}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Guardando...' : 'Guardar Cambios'}</button>
                </div>
              </form>
            </div>
          )}

          {/* PERFIL ADMIN */}
          {currentView === 'adminProfile' && !isCliente && (
            <div style={{ maxWidth: '600px' }}>
              <div className="view-header" style={{ marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Mi Perfil</h1>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>Almacenamiento y configuración de acceso.</p>
                </div>
              </div>

              {/* Almacenamiento */}
              <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: 'var(--primary-color)', fontSize: '1rem' }}>Almacenamiento de Documentos</h3>
                {(() => {
                  const pct = Math.min((storageInfo.used / storageInfo.total) * 100, 100);
                  const barColor = pct > 90 ? '#dc2626' : pct > 70 ? '#f59e0b' : '#10b981';
                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Usado: <strong style={{ color: 'var(--primary-color)' }}>{formatBytes(storageInfo.used)}</strong></span>
                        <span style={{ color: 'var(--text-muted)' }}>Total: <strong style={{ color: 'var(--primary-color)' }}>{formatBytes(storageInfo.total)}</strong></span>
                      </div>
                      <div style={{ background: 'var(--border-color)', borderRadius: '999px', height: '12px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '999px', transition: 'width 0.5s ease' }} />
                      </div>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>{pct.toFixed(1)}% utilizado</p>
                    </>
                  );
                })()}
              </div>

              {/* Cambiar contraseña */}
              <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: 'var(--primary-color)', fontSize: '1rem' }}>Cambiar Contraseña</h3>
                <form onSubmit={handleSaveAdminPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>
                      Nueva contraseña <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={4}
                      style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Guardando...' : 'Cambiar Contraseña'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* PERFIL EMPRESA */}
          {currentView === 'companyProfiles' && !isCliente && (
            <div>
              {!profileCompany ? (
                <>
                  <div className="view-header" style={{ marginBottom: '1.5rem' }}>
                    <div>
                      <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Perfil de Empresas</h1>
                      <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>Selecciona una empresa para ver sus datos y documentos.</p>
                    </div>
                  </div>
                  {companies.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No hay empresas registradas.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {companies.filter(c => role === 'steven_marin' || c.is_active !== 0).map(c => (
                        <div
                          key={c.id}
                          onClick={() => openCompanyProfile(c)}
                          style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'box-shadow 0.2s', opacity: c.is_active ? 1 : 0.6 }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                        >
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{c.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              {c.nit && `NIT: ${c.nit}`}{c.nit && c.contact_name && ' · '}{c.contact_name}
                            </div>
                          </div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>›</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <button className="btn-secondary" onClick={() => setProfileCompany(null)} style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      ← Volver a Empresas
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{profileCompany.name}</h1>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* Datos de la empresa */}
                    <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1rem' }}>Datos de la Empresa</h3>
                        {!editingProfileCompany && (
                          <button className="btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                            onClick={() => { setProfileCompanyEdit({ name: profileCompany.name || '', nit: profileCompany.nit || '', contact_name: profileCompany.contact_name || '', phone: profileCompany.phone || '', email: profileCompany.email || '' }); setEditingProfileCompany(true); }}>
                            ✏ Editar
                          </button>
                        )}
                      </div>
                      {editingProfileCompany ? (
                        <form onSubmit={handleSaveProfileCompany} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {[
                            { field: 'name',         label: 'Nombre',   required: true },
                            { field: 'nit',          label: 'NIT' },
                            { field: 'contact_name', label: 'Contacto' },
                            { field: 'phone',        label: 'Teléfono' },
                            { field: 'email',        label: 'Correo' },
                          ].map(({ field, label, required }) => (
                            <div key={field}>
                              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</label>
                              <input
                                type="text"
                                value={profileCompanyEdit[field]}
                                onChange={e => setProfileCompanyEdit(prev => ({ ...prev, [field]: e.target.value }))}
                                required={required}
                                style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.875rem', boxSizing: 'border-box' }}
                              />
                            </div>
                          ))}
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={busy}>{busy ? 'Guardando...' : 'Guardar'}</button>
                            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setEditingProfileCompany(false)}>Cancelar</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {[
                            { label: 'Nombre',   value: profileCompany.name },
                            { label: 'NIT',      value: profileCompany.nit },
                            { label: 'Contacto', value: profileCompany.contact_name },
                            { label: 'Teléfono', value: profileCompany.phone },
                            { label: 'Correo',   value: profileCompany.email },
                          ].map(({ label, value }) => (
                            <div key={label} style={{ marginBottom: '0.6rem', fontSize: '0.9rem' }}>
                              <span style={{ fontWeight: '600', color: 'var(--text-muted)', minWidth: '80px', display: 'inline-block' }}>{label}:</span>
                              <span style={{ color: value ? 'var(--primary-color)' : 'var(--text-muted)', marginLeft: '0.5rem' }}>{value || '—'}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    {/* Estadísticas de tickets */}
                    <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                      <h3 style={{ marginTop: 0, color: 'var(--primary-color)', fontSize: '1rem' }}>Tickets</h3>
                      {[
                        { key: 'pending',  label: 'Pendientes',  cls: 'status-pending' },
                        { key: 'progress', label: 'En Proceso',  cls: 'status-progress' },
                        { key: 'review',   label: 'En Revisión', cls: 'status-review' },
                        { key: 'done',     label: 'Enviados',    cls: 'status-done' },
                      ].map(({ key, label, cls }) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span className={`count-badge ${cls}`}>{label}</span>
                          <strong style={{ color: 'var(--primary-color)' }}>{profileCompany[`${key}_count`] || 0}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Documentos de la empresa */}
                  <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1rem' }}>Documentos de la Empresa</h3>
                      <label className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        📎 Subir Archivo
                        <input type="file" hidden onChange={handleUploadCompanyFile} />
                      </label>
                    </div>
                    {companyFilesLoading ? (
                      <div className="spinner-wrapper"><div className="spinner" /><span>Cargando documentos...</span></div>
                    ) : companyFiles.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay documentos subidos aún. Puedes subir archivos como el manual de convivencia, contratos, etc.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {companyFiles.map(f => (
                          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-color)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                            <span
                              onClick={() => setPreviewFile(f)}
                              style={{ flex: 1, cursor: 'pointer', color: 'var(--accent-color)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >📄 {f.filename}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(f.created_at).toLocaleDateString('es-CO')}</span>
                            <button
                              onClick={() => setPreviewFile(f)}
                              className="btn-secondary"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                            >👁 Ver</button>
                            <a
                              href={`${import.meta.env.VITE_API_URL}${f.path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', textDecoration: 'none' }}
                            >⬇ Descargar</a>
                            <button
                              className="btn-danger"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => handleDeleteCompanyFile(f.id)}
                            >×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
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

                  {loading ? (
                    <div className="spinner-wrapper"><div className="spinner" /><span>Cargando tickets...</span></div>
                  ) : (
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

                  {loading ? (
                    <div className="spinner-wrapper"><div className="spinner" /><span>Cargando tickets...</span></div>
                  ) : (
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
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                  {ticket.is_new ? <span className="alert-dot" title="Ticket nuevo" /> : null}#{ticket.id}
                                </td>
                                <td style={{ color: 'var(--text-muted)' }}>{ticket.assigned_name || ticket.assigned_email || 'Sin asignar'}</td>
                                <td style={{ fontWeight: ticket.is_new ? '700' : '500', color: 'var(--primary-color)' }}>{ticket.title}</td>
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

              {loading ? (
                <div className="spinner-wrapper"><div className="spinner" /><span>Cargando ticket...</span></div>
              ) : (
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
                              <option key={l.id} value={l.id}>{l.name || l.email}</option>
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
                            <span style={{ flex: 1 }}>📄 {f.filename}</span>
                            <button
                              onClick={() => handleDeleteFile(f.id)}
                              title="Eliminar archivo"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 'bold', fontSize: '1rem', lineHeight: 1, padding: '0 0.25rem' }}
                            >×</button>
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

      {/* MODAL CREAR USUARIO ADMIN */}
      {isCreateUserOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '1rem', width: '440px', maxWidth: '100%', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginTop: 0, color: 'var(--primary-color)' }}>Nuevo Usuario</h2>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>
                  Nombre completo <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej. María López Gómez"
                  required
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>
                  Cédula <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={e => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Ej. 1020304050"
                  required
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>Correo electrónico</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ej. abogada@marinabogados.com"
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>
                  Contraseña <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>Rol</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                >
                  <option value="abogada_asignada">Abogada Asignada</option>
                  <option value="abogada_lider">Abogada Líder</option>
                  {role === 'steven_marin' && (
                    <option value="steven_marin">Admin</option>
                  )}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsCreateUserOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Creando...' : 'Crear Usuario'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR EMPRESA */}
      {isCreateCompanyOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '1rem', width: '500px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginTop: 0, color: 'var(--primary-color)' }}>Nueva Empresa</h2>
            <form onSubmit={handleCreateCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { field: 'name',         label: 'Nombre de la empresa',  placeholder: 'Ej. Distribuidora del Norte', required: true },
                { field: 'nit',          label: 'NIT',                   placeholder: 'Ej. 900123456-7' },
                { field: 'contact_name', label: 'Persona de contacto',   placeholder: 'Ej. Juan García' },
                { field: 'phone',        label: 'Teléfono',              placeholder: 'Ej. 3001234567' },
                { field: 'email',        label: 'Correo electrónico',    placeholder: 'Ej. contacto@empresa.com' },
              ].map(({ field, label, placeholder, required }) => (
                <div key={field}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>
                    {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    value={newCompany[field]}
                    onChange={e => setNewCompany(prev => {
                      const updated = { ...prev, [field]: e.target.value };
                      if (field === 'nit' && (prev.username === '' || prev.username === prev.nit))
                        updated.username = e.target.value;
                      return updated;
                    })}
                    placeholder={placeholder}
                    required={required}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                  />
                </div>
              ))}
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.25rem 0' }} />
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Acceso del cliente al portal</p>
              {[
                { field: 'username', label: 'Usuario (Cédula / NIT)', placeholder: 'Ej. 900123456', required: true, type: 'text' },
                { field: 'password', label: 'Contraseña',             placeholder: '••••••••',      required: true, type: 'password' },
              ].map(({ field, label, placeholder, required, type }) => (
                <div key={field}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>
                    {label} <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type={type}
                    value={newCompany[field]}
                    onChange={e => setNewCompany(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={placeholder}
                    required={required}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsCreateCompanyOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Creando...' : 'Crear Empresa'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PREVISUALIZAR DOCUMENTO */}
      {previewFile && (() => {
        const url = `${import.meta.env.VITE_API_URL}${previewFile.path}`;
        const ext = previewFile.filename.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
        const isPdf = ext === 'pdf';
        const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
        const officeIcon = ['xls', 'xlsx'].includes(ext) ? '📊' : ['ppt', 'pptx'].includes(ext) ? '📑' : '📝';
        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
            <div style={{ background: 'var(--surface-color)', borderRadius: '1rem', width: '98%', maxWidth: '1100px', height: '95vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

              {/* Header */}
              <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{isImage ? '🖼️' : isPdf ? '📄' : isOffice ? officeIcon : '📎'}</span>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--primary-color)', fontSize: '0.95rem' }}>{previewFile.filename}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {profileCompany?.name && <span style={{ fontWeight: '600' }}>{profileCompany.name} · </span>}
                      Subido el {new Date(previewFile.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <a href={url} target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none' }}>↗ Abrir</a>
                  <a href={url} download={previewFile.filename} className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none' }}>⬇ Descargar</a>
                  <button onClick={() => setPreviewFile(null)} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1, padding: '0.2rem 0.55rem' }}>×</button>
                </div>
              </div>

              {/* Info empresa — compacta */}
              {profileCompany && (
                <div style={{ padding: '0.5rem 1.5rem', background: '#f8f9fa', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Empresa', value: profileCompany.name },
                    { label: 'NIT', value: profileCompany.nit },
                    { label: 'Contacto', value: profileCompany.contact_name },
                    { label: 'Tel', value: profileCompany.phone },
                    { label: 'Correo', value: profileCompany.email },
                  ].filter(d => d.value).map(({ label, value }) => (
                    <div key={label} style={{ fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{label}: </span>
                      <span style={{ color: 'var(--primary-color)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Previsualización — ocupa todo el espacio restante */}
              <div style={{ flex: 1, overflow: 'hidden', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isImage ? (
                  <img src={url} alt={previewFile.filename} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : isPdf ? (
                  <iframe src={url} title={previewFile.filename} style={{ width: '100%', height: '100%', border: 'none' }} />
                ) : isOffice ? (
                  <iframe src={officeViewerUrl} title={previewFile.filename} style={{ width: '100%', height: '100%', border: 'none' }} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#d1d5db' }}>
                    <p style={{ fontSize: '3rem', margin: '0 0 1rem' }}>📎</p>
                    <p style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>Vista previa no disponible para este tipo de archivo.</p>
                    <a href={url} download={previewFile.filename} className="btn-primary" style={{ textDecoration: 'none', padding: '0.6rem 1.25rem' }}>⬇ Descargar archivo</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL EDITAR USUARIO */}
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '1rem', width: '440px', maxWidth: '100%', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginTop: 0, color: 'var(--primary-color)' }}>Editar Usuario</h2>
            <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cédula: <strong>{editingUser.username}</strong></p>
            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>Nombre completo</label>
                <input
                  type="text"
                  value={editUserForm.name}
                  onChange={e => setEditUserForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej. María López Gómez"
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>Correo electrónico</label>
                <input
                  type="email"
                  value={editUserForm.email}
                  onChange={e => setEditUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ej. abogada@marinabogados.com"
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>Rol</label>
                <select
                  value={editUserForm.role}
                  onChange={e => setEditUserForm(prev => ({ ...prev, role: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                >
                  <option value="abogada_asignada">Abogada Asignada</option>
                  <option value="abogada_lider">Abogada Líder</option>
                  <option value="steven_marin">Admin</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>
                  Nueva contraseña <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(dejar vacío para no cambiar)</span>
                </label>
                <input
                  type="password"
                  value={editUserForm.password}
                  onChange={e => setEditUserForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn-secondary" onClick={() => setEditingUser(null)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Guardando...' : 'Guardar Cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Enviando...' : 'Enviar Ticket'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
