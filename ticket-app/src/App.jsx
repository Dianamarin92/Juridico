import React, { useState } from 'react';
import './index.css';

// --- MOCK DATA ---
const MOCK_COMPANIES = [
  {
    id: 'COMP-01',
    name: 'Distribuidora del Norte S.A.S',
    tickets: [
      {
        id: 'TKT-001',
        title: 'Despido con justa causa - Empleado Juan Pérez',
        status: 'pending',
        date: '2026-05-05',
        assignedTo: 'Sin asignar',
        history: [{ user: 'Cliente', time: '05-May 10:00 AM', action: 'Ticket creado' }],
        messages: [
          { sender: 'Cliente', text: 'Hola, necesito hacer un despido para mañana. Adjunto soportes.', type: 'received' }
        ]
      },
      {
        id: 'TKT-005',
        title: 'Revisión de Contrato a Término Fijo',
        status: 'progress',
        date: '2026-05-06',
        assignedTo: 'Abogada Asignada',
        history: [
          { user: 'Cliente', time: '06-May 08:00 AM', action: 'Ticket creado' },
          { user: 'Abogada Asignada', time: '06-May 09:00 AM', action: 'Estado cambiado a En Progreso' }
        ],
        messages: []
      },
      {
        id: 'TKT-007',
        title: 'Elaboración de poder especial',
        status: 'done',
        date: '2026-05-01',
        assignedTo: 'Abogada Asignada',
        history: [
          { user: 'Cliente', time: '01-May 10:00 AM', action: 'Ticket creado' },
          { user: 'Abogada Asignada', time: '02-May 03:00 PM', action: 'Cambió a Enviado' }
        ],
        messages: []
      },
      {
        id: 'TKT-008',
        title: 'Concepto jurídico sobre horas extras',
        status: 'done',
        date: '2026-04-25',
        assignedTo: 'Steven Marin',
        history: [
          { user: 'Cliente', time: '25-Apr 09:00 AM', action: 'Ticket creado' },
          { user: 'Steven Marin', time: '28-Apr 11:00 AM', action: 'Cambió a Enviado' }
        ],
        messages: []
      }
    ]
  },
  {
    id: 'COMP-02',
    name: 'Tech Solutions Ltda',
    tickets: [
      {
        id: 'TKT-002',
        title: 'Actualización de Reglamento Interno',
        status: 'progress',
        date: '2026-05-04',
        assignedTo: 'Abogada Líder',
        history: [
          { user: 'Cliente', time: '04-May 09:00 AM', action: 'Ticket creado' },
          { user: 'Abogada Líder', time: '04-May 11:30 AM', action: 'Estado cambiado a En Progreso' }
        ],
        messages: [
          { sender: 'Cliente', text: 'Necesitamos incluir la política de teletrabajo.', type: 'received' },
          { sender: 'Abogada Líder', text: 'Entendido. Ya estamos trabajando en el borrador.', type: 'sent' }
        ]
      }
    ]
  },
  {
    id: 'COMP-03',
    name: 'Inmobiliaria Central',
    tickets: [
      {
        id: 'TKT-003',
        title: 'Respuesta a Derecho de Petición',
        status: 'review',
        date: '2026-05-02',
        assignedTo: 'Abogada Asignada',
        history: [
          { user: 'Cliente', time: '02-May 08:00 AM', action: 'Ticket creado' },
          { user: 'Abogada Asignada', time: '03-May 04:00 PM', action: 'Estado cambiado a Para Revisión' }
        ],
        messages: [
          { sender: 'Abogada Asignada', text: 'El borrador está listo para revisión del jefe.', type: 'sent' }
        ]
      },
      {
        id: 'TKT-004',
        title: 'Contrato de Arrendamiento Local 5',
        status: 'done',
        date: '2026-04-28',
        assignedTo: 'Steven Marin',
        history: [
          { user: 'Cliente', time: '28-Apr 10:00 AM', action: 'Ticket creado' },
          { user: 'Steven Marin', time: '30-Apr 02:00 PM', action: 'Aprobado y Finalizado' }
        ],
        messages: []
      },
      {
        id: 'TKT-006',
        title: 'Asesoría en compra de lote',
        status: 'pending',
        date: '2026-05-06',
        assignedTo: 'Sin asignar',
        history: [
          { user: 'Cliente', time: '06-May 10:00 AM', action: 'Ticket creado' }
        ],
        messages: []
      }
    ]
  }
];

const ROLES = ['Cliente', 'Abogada Líder', 'Abogada Asignada', 'Steven Marin'];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState('Abogada Líder');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, companyDetail, ticketDetail
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [companies, setCompanies] = useState(MOCK_COMPANIES);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');

  // Helper to get status info
  const getStatusInfo = (status) => {
    switch(status) {
      case 'pending': return { text: 'Pendiente', cls: 'status-pending' };
      case 'progress': return { text: 'En Proceso', cls: 'status-progress' };
      case 'review': return { text: 'En Revisión', cls: 'status-review' };
      case 'done': return { text: 'Enviado', cls: 'status-done' };
      default: return { text: 'Desconocido', cls: '' };
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if(loginPassword.trim() !== '') {
      setIsLoggedIn(true);
      if (role === 'Cliente') {
        setSelectedCompany(companies.find(c => c.id === 'COMP-01'));
        setCurrentView('companyDetail');
      } else {
        setCurrentView('dashboard');
      }
    }
  };

  const handleOpenCompany = (company) => {
    setSelectedCompany(company);
    setCurrentView('companyDetail');
  };

  const handleOpenTicket = (ticket, company) => {
    setSelectedTicket(ticket);
    setSelectedCompany(company);
    setCurrentView('ticketDetail');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if(!chatInput.trim() || !selectedTicket) return;
    
    const updatedCompanies = companies.map(c => {
      if (c.id === selectedCompany.id) {
        return {
          ...c,
          tickets: c.tickets.map(t => {
            if (t.id === selectedTicket.id) {
              return {
                ...t,
                messages: [...t.messages, { sender: role, text: chatInput, type: 'sent' }]
              };
            }
            return t;
          })
        };
      }
      return c;
    });

    setCompanies(updatedCompanies);
    const updatedCompany = updatedCompanies.find(c => c.id === selectedCompany.id);
    setSelectedCompany(updatedCompany);
    setSelectedTicket(updatedCompany.tickets.find(t => t.id === selectedTicket.id));
    setChatInput('');
  };

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!newTicketTitle.trim() || !newTicketMessage.trim()) return;

    const newTicketId = `TKT-${Math.floor(Math.random() * 900) + 100}`;
    const now = new Date();
    const dateString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const timeString = `${now.getDate()}-May ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newTicket = {
      id: newTicketId,
      title: newTicketTitle,
      status: 'pending',
      date: dateString,
      assignedTo: 'Sin asignar',
      history: [{ user: role, time: timeString, action: 'Ticket creado' }],
      messages: [{ sender: role, text: newTicketMessage, type: 'sent' }]
    };

    const updatedCompanies = companies.map(c => {
      if (c.id === selectedCompany.id) {
        return {
          ...c,
          tickets: [newTicket, ...c.tickets]
        };
      }
      return c;
    });

    setCompanies(updatedCompanies);
    const updatedCompany = updatedCompanies.find(c => c.id === selectedCompany.id);
    setSelectedCompany(updatedCompany);
    setIsCreateModalOpen(false);
    setNewTicketTitle('');
    setNewTicketMessage('');
  };

  const handleChangeStatus = (newStatus, actionText) => {
    const updatedCompanies = companies.map(c => {
      if (c.id === selectedCompany.id) {
        return {
          ...c,
          tickets: c.tickets.map(t => {
            if (t.id === selectedTicket.id) {
              const now = new Date();
              const timeString = `${now.getDate()}-May ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
              return {
                ...t,
                status: newStatus,
                history: [...t.history, { user: role, time: timeString, action: actionText }]
              };
            }
            return t;
          })
        };
      }
      return c;
    });

    setCompanies(updatedCompanies);
    const updatedCompany = updatedCompanies.find(c => c.id === selectedCompany.id);
    setSelectedCompany(updatedCompany);
    setSelectedTicket(updatedCompany.tickets.find(t => t.id === selectedTicket.id));
  };

  const handleChangeAssignment = (newAssignee) => {
    const actionText = `Se asignó a: ${newAssignee}`;
    const updatedCompanies = companies.map(c => {
      if (c.id === selectedCompany.id) {
        return {
          ...c,
          tickets: c.tickets.map(t => {
            if (t.id === selectedTicket.id) {
              const now = new Date();
              const timeString = `${now.getDate()}-May ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
              return {
                ...t,
                assignedTo: newAssignee,
                history: [...t.history, { user: role, time: timeString, action: actionText }]
              };
            }
            return t;
          })
        };
      }
      return c;
    });

    setCompanies(updatedCompanies);
    const updatedCompany = updatedCompanies.find(c => c.id === selectedCompany.id);
    setSelectedCompany(updatedCompany);
    setSelectedTicket(updatedCompany.tickets.find(t => t.id === selectedTicket.id));
  };

  if (!isLoggedIn) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <img src="/logo.jpg" alt="Marin & Abogados Logo" style={{ maxHeight: '80px', marginBottom: '1rem', objectFit: 'contain' }} />
          <h1 style={{margin: '0 0 0.5rem 0', color: 'var(--primary-color)'}}>Marin & Abogados</h1>
          <p style={{margin: 0, color: 'var(--text-muted)'}}>Inicia sesión en tu cuenta</p>
          
          <form onSubmit={handleLogin}>
            <div className="login-input-group">
              <label>Usuario:</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            
            <div className="login-input-group">
              <label>Contraseña:</label>
              <input 
                type="password" 
                placeholder="..." 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="btn-primary login-btn">
              Ingresar al Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-title">
          <img src="/logo.jpg" alt="Marin & Abogados Logo" style={{ maxHeight: '32px', objectFit: 'contain' }} />
          Marin & Abogados
        </div>
        
        {role !== 'Cliente' ? (
          <div className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
            Directorio de Empresas
          </div>
        ) : (
          <div className={`nav-link ${currentView === 'companyDetail' || currentView === 'ticketDetail' ? 'active' : ''}`} onClick={() => {
            setSelectedCompany(companies.find(c => c.id === 'COMP-01'));
            setCurrentView('companyDetail');
          }}>
            Mis Tickets
          </div>
        )}
        <div className="nav-link">
          Documentos Plantilla
        </div>
        {role === 'Steven Marin' && (
          <div className={`nav-link ${currentView === 'reports' ? 'active' : ''}`} onClick={() => setCurrentView('reports')}>
            Informes
          </div>
        )}
        
        <div style={{marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem'}}>
          <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem'}}>Simular Rol:</p>
          <select 
            value={role} 
            onChange={(e) => { 
              const newRole = e.target.value;
              setRole(newRole); 
              if (newRole === 'Cliente') {
                setSelectedCompany(companies.find(c => c.id === 'COMP-01'));
                setCurrentView('companyDetail');
              } else {
                setCurrentView('dashboard'); 
              }
            }}
            style={{width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)'}}
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="topbar">
          <div className="search-bar" style={{color: '#a3a3a3'}}>
            Gestión Centralizada - {role}
          </div>
          <div className="user-info">
            <span className="role-badge">{role}</span>
            <div style={{width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>
              {role.charAt(0)}
            </div>
            <button 
              className="btn-secondary" 
              style={{padding: '0.4rem 0.75rem', fontSize: '0.8rem', marginLeft: '0.5rem'}}
              onClick={() => { setIsLoggedIn(false); setLoginPassword(''); }}
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        <section className="content-area">
          {/* VISTA 1: TABLA DE EMPRESAS */}
          {currentView === 'dashboard' && (
            <>
              <div className="view-header">
                <div>
                  <h1 style={{margin: 0, fontSize: '1.5rem'}}>Directorio de Empresas</h1>
                  <p style={{margin: '0.25rem 0 0', color: 'var(--text-muted)'}}>Revisa el estado general de los casos por cliente.</p>
                </div>
                {role === 'Cliente' && (
                  <button className="btn-primary" onClick={() => { setSelectedCompany(companies.find(c => c.id === 'COMP-01')); setIsCreateModalOpen(true); }}>
                    + Nuevo Requerimiento
                  </button>
                )}
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Empresa Cliente</th>
                      <th style={{textAlign: 'center'}}>Tickets Totales</th>
                      <th style={{textAlign: 'center'}}>Pendientes</th>
                      <th style={{textAlign: 'center'}}>En Proceso</th>
                      <th style={{textAlign: 'center'}}>En Revisión</th>
                      <th style={{textAlign: 'center'}}>Enviados</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map(company => {
                      const hasPending = company.tickets.some(t => t.status === 'pending');
                      const pendingCount = company.tickets.filter(t => t.status === 'pending').length;
                      const progressCount = company.tickets.filter(t => t.status === 'progress').length;
                      const reviewCount = company.tickets.filter(t => t.status === 'review').length;
                      const doneCount = company.tickets.filter(t => t.status === 'done').length;

                      // Si es cliente, solo ve su empresa (simulación simple)
                      if (role === 'Cliente' && company.id !== 'COMP-01') return null;

                      return (
                        <tr key={company.id} onClick={() => handleOpenCompany(company)}>
                          <td>
                            <div className="company-name-cell">
                              {hasPending && <span className="alert-dot" title="Nuevos tickets pendientes"></span>}
                              {company.name}
                            </div>
                          </td>
                          <td style={{textAlign: 'center'}}>{company.tickets.length}</td>
                          <td style={{textAlign: 'center'}}>
                            {pendingCount > 0 ? <span className="count-badge status-pending">{pendingCount}</span> : <span style={{color: 'var(--text-muted)'}}>0</span>}
                          </td>
                          <td style={{textAlign: 'center'}}>
                            {progressCount > 0 ? <span className="count-badge status-progress">{progressCount}</span> : <span style={{color: 'var(--text-muted)'}}>0</span>}
                          </td>
                          <td style={{textAlign: 'center'}}>
                            {reviewCount > 0 ? <span className="count-badge status-review">{reviewCount}</span> : <span style={{color: 'var(--text-muted)'}}>0</span>}
                          </td>
                          <td style={{textAlign: 'center'}}>
                            {doneCount > 0 ? <span className="count-badge status-done">{doneCount}</span> : <span style={{color: 'var(--text-muted)'}}>0</span>}
                          </td>
                          <td>
                            <button className="btn-secondary" style={{padding: '0.25rem 0.75rem', fontSize: '0.75rem'}}>Ver Detalle →</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* VISTA DE INFORMES */}
          {currentView === 'reports' && (
            <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
              <h2>Módulo de Informes</h2>
              <p>Esta sección está en construcción. Aquí se mostrarán las estadísticas de gestión y tiempos de respuesta de la firma.</p>
            </div>
          )}

          {/* VISTA 2: DETALLE DE EMPRESA (LISTA DE TICKETS) */}
          {currentView === 'companyDetail' && selectedCompany && (
            <>
              <div className="view-header">
                <div>
                  {role !== 'Cliente' && (
                    <button className="btn-secondary" onClick={() => setCurrentView('dashboard')} style={{marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'}}>
                      ← Volver a Empresas
                    </button>
                  )}
                  <h1 style={{margin: 0, fontSize: '1.5rem'}}>{selectedCompany.name}</h1>
                  <p style={{margin: '0.25rem 0 0', color: 'var(--text-muted)'}}>Todos los tickets asociados a esta empresa.</p>
                </div>
                {role === 'Cliente' && (
                  <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                    + Crear Ticket
                  </button>
                )}
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID Ticket</th>
                      {role !== 'Cliente' && <th>Asignado A</th>}
                      <th>Asunto / Requerimiento</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCompany.tickets.map(ticket => {
                      const status = getStatusInfo(ticket.status);
                      return (
                        <tr key={ticket.id} onClick={() => handleOpenTicket(ticket, selectedCompany)}>
                          <td style={{color: 'var(--text-muted)', fontSize: '0.875rem'}}>{ticket.id}</td>
                          {role !== 'Cliente' && <td style={{fontWeight: '500', color: 'var(--text-muted)'}}>{ticket.assignedTo}</td>}
                          <td style={{fontWeight: '500', color: 'var(--primary-color)'}}>{ticket.title}</td>
                          <td style={{color: 'var(--text-muted)', fontSize: '0.875rem'}}>{ticket.date}</td>
                          <td>
                            <span className={`count-badge ${status.cls}`}>{status.text}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* VISTA 3: DETALLE DEL TICKET (CHAT Y LOG) */}
          {currentView === 'ticketDetail' && selectedTicket && (
            <>
              <div className="view-header">
                <div>
                  <button className="btn-secondary" onClick={() => setCurrentView('companyDetail')} style={{marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'}}>
                    ← Volver a Tickets de Empresa
                  </button>
                  <h1 style={{margin: 0, fontSize: '1.5rem'}}>{selectedTicket.title}</h1>
                  <p style={{margin: '0.25rem 0 0', color: 'var(--text-muted)'}}>{selectedCompany.name} | Ref: {selectedTicket.id}</p>
                </div>
                {role !== 'Cliente' && (
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <label style={{fontWeight: '500'}}>Cambiar Estado:</label>
                    <select 
                      value={selectedTicket.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        let actionText = '';
                        if (newStatus === 'pending') actionText = 'Cambió a Pendiente';
                        if (newStatus === 'progress') actionText = 'Cambió a En Proceso';
                        if (newStatus === 'review') actionText = 'Cambió a En Revisión';
                        if (newStatus === 'done') actionText = 'Cambió a Enviado';
                        handleChangeStatus(newStatus, actionText);
                      }}
                      style={{padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontWeight: 'bold'}}
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

              <div style={{display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem'}}>
                <div className="chat-container" style={{height: '500px'}}>
                  <div style={{padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', fontWeight: '600'}}>
                    Hilo de Comunicación
                  </div>
                  <div className="chat-messages">
                    {selectedTicket.messages.length === 0 && (
                      <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>No hay mensajes aún.</p>
                    )}
                    {selectedTicket.messages.map((msg, i) => (
                      <div key={i} className={`message ${msg.type}`}>
                        <div className="message-sender">{msg.sender}</div>
                        <div>{msg.text}</div>
                      </div>
                    ))}
                  </div>
                  <form className="chat-input" onSubmit={handleSendMessage}>
                    {role !== 'Cliente' && (
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        title="Subir documento" 
                        onClick={() => alert("Función de subida de archivos en desarrollo...")} 
                        style={{padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}
                      >
                        📎 Adjuntar
                      </button>
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

                <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                  <div style={{background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)'}}>
                    <h3 style={{marginTop: 0}}>Información</h3>
                    <p style={{fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0'}}><strong>Estado actual:</strong> <span className={`count-badge ${getStatusInfo(selectedTicket.status).cls}`} style={{display: 'inline-flex', marginLeft: '0.5rem'}}>{getStatusInfo(selectedTicket.status).text}</span></p>
                    {role !== 'Cliente' && (
                      <div style={{fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.75rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <strong>👤 Asignado a:</strong>
                        <select 
                          value={selectedTicket.assignedTo}
                          onChange={(e) => handleChangeAssignment(e.target.value)}
                          style={{padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', fontSize: '0.875rem'}}
                        >
                          <option value="Sin asignar">Sin asignar</option>
                          {ROLES.filter(r => r !== 'Cliente').map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div style={{background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                      <h3 style={{margin: 0}}>Adjuntos</h3>
                      {role === 'Cliente' && (
                        <button 
                          className="btn-primary" 
                          onClick={() => alert("Función de subida de archivos en desarrollo...")}
                          style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}
                        >
                          📎 Subir Archivo
                        </button>
                      )}
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'var(--bg-color)', borderRadius: '0.5rem', fontSize: '0.875rem'}}>
                        📄 documento_inicial.pdf
                      </div>
                    </div>
                  </div>

                  {role !== 'Cliente' && (
                    <div style={{background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)'}}>
                      <h3 style={{marginTop: 0}}>Historial (Auditoría)</h3>
                      <div className="history-log">
                        {selectedTicket.history.map((hist, i) => (
                          <div key={i} className="history-item">
                            <div className="history-time">{hist.time}</div>
                            <div className="history-content">
                              <strong>{hist.user}</strong>: {hist.action}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* MODAL CREAR TICKET */}
      {isCreateModalOpen && (
        <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="modal-content" style={{backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '1rem', width: '500px', maxWidth: '90%', border: '1px solid var(--border-color)'}}>
            <h2 style={{marginTop: 0, color: 'var(--primary-color)'}}>Crear Nuevo Ticket</h2>
            <p style={{color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem'}}>
              Ingresa los detalles de tu requerimiento. Nuestro equipo será notificado inmediatamente.
            </p>
            <form onSubmit={handleCreateTicket} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>Asunto / Título del Requerimiento</label>
                <input 
                  type="text" 
                  value={newTicketTitle} 
                  onChange={e => setNewTicketTitle(e.target.value)} 
                  style={{width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)'}}
                  placeholder="Ej. Revisión de contrato laboral..."
                  required
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>Mensaje Inicial</label>
                <textarea 
                  value={newTicketMessage} 
                  onChange={e => setNewTicketMessage(e.target.value)} 
                  style={{width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', minHeight: '100px'}}
                  placeholder="Describe detalladamente lo que necesitas..."
                  required
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>Documentos Adjuntos</label>
                <button type="button" className="btn-secondary" onClick={() => alert("Función de subida de archivos en desarrollo...")} style={{display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem'}}>
                  📎 Adjuntar Archivos
                </button>
                <p style={{fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0'}}>Puedes subir PDFs, imágenes o documentos de Word.</p>
              </div>
              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)'}}>
                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Enviar Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
