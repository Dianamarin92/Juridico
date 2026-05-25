import React, { useState, useEffect } from 'react';
import './landing.css';

export default function LandingPage({ onLogin }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div className="landing">

      {/* NAVBAR */}
      <nav className={`land-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="land-nav-inner">
          <div className="land-logo">
            <img src="/logo.jpg" alt="Marín & Abogados" />
            <span>MARÍN <em>&amp;</em> ABOGADOS</span>
          </div>
          <button className="land-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
            <span /><span /><span />
          </button>
          <ul className={`land-nav-links ${menuOpen ? 'open' : ''}`}>
            <li><button onClick={() => scrollTo('quienes')}>Quiénes Somos</button></li>
            <li><button onClick={() => scrollTo('servicios')}>Servicios</button></li>
            <li><button onClick={() => scrollTo('valores')}>Valores</button></li>
            <li><button onClick={() => scrollTo('contacto')}>Contacto</button></li>
            <li>
              <button className="land-btn-login" onClick={onLogin}>
                Iniciar Sesión
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* HERO */}
      <section className="land-hero">
        <div className="land-hero-overlay" />
        <div className="land-hero-content">
          <p className="land-hero-tagline">Derecho Laboral · Seguridad Social · Consultoría Jurídica</p>
          <h1>Su salud legal,<br />tan importante como<br />su salud física.</h1>
          <p className="land-hero-sub">
            Expertos en representación jurídica laboral y pensional para empresas y personas del Eje Cafetero.
          </p>
          <div className="land-hero-actions">
            <button className="land-btn-primary" onClick={() => scrollTo('servicios')}>
              Conocer Servicios
            </button>
            <button className="land-btn-outline" onClick={() => scrollTo('contacto')}>
              Contáctenos
            </button>
          </div>
        </div>
        <div className="land-hero-scroll">
          <span>↓</span>
        </div>
      </section>

      {/* QUIÉNES SOMOS */}
      <section className="land-section land-about" id="quienes">
        <div className="land-container land-about-grid">
          <div className="land-about-text">
            <span className="land-eyebrow">Quiénes Somos</span>
            <h2>Un equipo experto a su servicio</h2>
            <p>
              Somos una empresa conformada por un equipo experto de abogados, dedicados a ofrecer servicios de
              consultoría y representación jurídica en temas laborales referentes a la salud jurídica de las
              empresas, las relaciones entre empleador y empleado, y la seguridad social con énfasis en el
              sistema pensional.
            </p>
            <p>
              Contamos con asesoría multidisciplinaria en salud, administración, sicología y economía,
              enfocados a alcanzar el éxito en los procesos de nuestros clientes.
            </p>
            <div className="land-stats">
              <div className="land-stat">
                <strong>27+</strong>
                <span>Empresas clientes</span>
              </div>
              <div className="land-stat">
                <strong>100%</strong>
                <span>Compromiso ético</span>
              </div>
              <div className="land-stat">
                <strong>ISO</strong>
                <span>En proceso 9001</span>
              </div>
            </div>
          </div>
          <div className="land-about-card">
            <div className="land-oferta">
              <div className="land-oferta-icon">⚖️</div>
              <h3>Nuestra Oferta de Valor</h3>
              <p>
                "Nuestro valor diferencial lo hace la cercanía que ofrecemos a nuestros clientes en el
                servicio, el trato amable y horarios flexibles. Más que representar, respaldamos sus
                decisiones. Nuestra honestidad y transparencia es nuestra mayor promesa."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section className="land-section land-services" id="servicios">
        <div className="land-container">
          <span className="land-eyebrow land-eyebrow-light">Nuestros Servicios</span>
          <h2 className="land-section-title-light">Soluciones jurídicas especializadas</h2>
          <p className="land-section-sub">
            Portafolio de servicios a la medida de las necesidades de empresas y personas naturales.
          </p>
          <div className="land-services-grid">
            <div className="land-service-card">
              <div className="land-service-icon">🏢</div>
              <h3>Clínica Jurídica</h3>
              <p className="land-service-tag">Para Empresas</p>
              <p>
                Producto especializado para el segmento corporativo. Pensamos en las necesidades de
                promoción, prevención y saneamiento jurídico de su empresa.
              </p>
              <ul>
                <li>Revisión y elaboración de contratos</li>
                <li>Reglamentos internos de trabajo</li>
                <li>Salud jurídica preventiva</li>
                <li>Representación en demandas laborales</li>
              </ul>
            </div>

            <div className="land-service-card land-service-featured">
              <div className="land-service-icon">🧓</div>
              <h3>Vivir Feliz</h3>
              <p className="land-service-tag">Seguridad Social</p>
              <p>
                Asesoría especializada al momento de reclamar el fruto de su trabajo. La pensión constituye
                su sustento económico en caso de vejez, invalidez o sobrevivientes.
              </p>
              <ul>
                <li>Reclamación de pensión de vejez</li>
                <li>Pensión de invalidez</li>
                <li>Pensión de sobrevivientes</li>
                <li>Asesoría en seguridad social</li>
              </ul>
            </div>

            <div className="land-service-card">
              <div className="land-service-icon">👷</div>
              <h3>Soy Trabajador</h3>
              <p className="land-service-tag">Derecho Laboral Individual</p>
              <p>
                Lo representamos y estamos de su lado en las relaciones empleador-empleado. Asesoramos
                en procesos conciliatorios y en demandas laborales.
              </p>
              <ul>
                <li>Despidos y liquidaciones</li>
                <li>Conciliaciones laborales</li>
                <li>Demandas ante juzgados</li>
                <li>Derechos de petición</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* MISIÓN Y VISIÓN */}
      <section className="land-section land-mision" id="mision">
        <div className="land-container land-mision-grid">
          <div className="land-mision-card">
            <div className="land-mision-icon">🎯</div>
            <h3>Misión</h3>
            <p>
              Prestamos servicios legales especializados a la medida de las personas naturales, compañías
              públicas y privadas. Estamos comprometidos con el éxito de los procesos y proyectos de
              nuestros clientes, con alto sentido ético, responsabilidad y compromiso.
            </p>
          </div>
          <div className="land-mision-card">
            <div className="land-mision-icon">🔭</div>
            <h3>Visión</h3>
            <p>
              Ser reconocidos como la mejor empresa de servicios jurídicos del Eje Cafetero, por la
              calidad en la prestación de nuestros servicios, por ser cercanos a nuestros clientes, y por
              la ética y profesionalismo de nuestro equipo de trabajo.
            </p>
          </div>
          <div className="land-mision-card">
            <div className="land-mision-icon">✅</div>
            <h3>Política de Calidad</h3>
            <p>
              Satisfacer las expectativas de nuestros clientes es nuestro principal objetivo. Garantizamos
              trazabilidad e información actualizada del estado de sus procesos, atendiendo sus inquietudes
              ágil y eficientemente.
            </p>
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="land-section land-valores" id="valores">
        <div className="land-container">
          <span className="land-eyebrow">Nuestros Valores</span>
          <h2>Así somos en Marín &amp; Abogados</h2>
          <div className="land-valores-grid">
            {[
              { icon: '🤝', title: 'Transparencia', desc: 'La honestidad y la transparencia son nuestra principal virtud en cada actuación.' },
              { icon: '🛡️', title: 'Confiabilidad', desc: 'Nuestro sentido ético garantiza la legalidad de todas las actuaciones de nuestros clientes.' },
              { icon: '🌱', title: 'Respeto', desc: 'Respetuosos de la gente, sus procesos y el medio ambiente en todo lo que hacemos.' },
              { icon: '💡', title: 'Innovación', desc: 'Actualizados constantemente en congresos, seminarios y cursos a nivel regional y nacional.' },
              { icon: '🎯', title: 'Resultados', desc: 'Orientados a los resultados positivos en cada uno de los procesos de nuestros clientes.' },
              { icon: '👂', title: 'Cercanía', desc: 'Nuestra capacidad de escuchar nos hace confidentes. Trato amable y horarios flexibles.' },
            ].map(v => (
              <div className="land-valor-card" key={v.title}>
                <span className="land-valor-icon">{v.icon}</span>
                <h4>{v.title}</h4>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="land-cta">
        <div className="land-container land-cta-inner">
          <div>
            <h2>¿Listo para proteger su empresa?</h2>
            <p>Acceda a su portal de gestión jurídica o contáctenos para una consulta inicial.</p>
          </div>
          <div className="land-cta-actions">
            <button className="land-btn-primary" onClick={onLogin}>
              Iniciar Sesión al Portal
            </button>
            <button className="land-btn-outline-dark" onClick={() => scrollTo('contacto')}>
              Solicitar Consulta
            </button>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section className="land-section land-contact" id="contacto">
        <div className="land-container land-contact-grid">
          <div className="land-contact-info">
            <span className="land-eyebrow">Contacto</span>
            <h2>Estamos para atenderle</h2>
            <p>Comuníquese con nosotros para agendar una consulta o solicitar información sobre nuestros servicios.</p>
            <div className="land-contact-items">
              <div className="land-contact-item">
                <span>📍</span>
                <div>
                  <strong>Ubicación</strong>
                  <p>Pereira, Risaralda — Área Metropolitana Centro Occidente</p>
                </div>
              </div>
              <div className="land-contact-item">
                <span>⚖️</span>
                <div>
                  <strong>Especialidad</strong>
                  <p>Derecho Laboral · Seguridad Social · Pensional</p>
                </div>
              </div>
              <div className="land-contact-item">
                <span>🔐</span>
                <div>
                  <strong>Portal de Clientes</strong>
                  <p>
                    Acceda a sus casos en tiempo real.{' '}
                    <button className="land-link" onClick={onLogin}>Iniciar Sesión →</button>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="land-contact-card">
            <h3>Solicitar Información</h3>
            <form className="land-form" onSubmit={e => { e.preventDefault(); alert('Mensaje enviado. Le contactaremos pronto.'); }}>
              <input type="text" placeholder="Nombre completo" required />
              <input type="email" placeholder="Correo electrónico" required />
              <input type="text" placeholder="Empresa (opcional)" />
              <select>
                <option value="">Servicio de interés</option>
                <option>Clínica Jurídica (Empresas)</option>
                <option>Vivir Feliz (Pensión)</option>
                <option>Soy Trabajador (Laboral)</option>
                <option>Otro</option>
              </select>
              <textarea placeholder="Cuéntenos brevemente su necesidad..." rows={4} />
              <button type="submit" className="land-btn-primary land-btn-full">
                Enviar Solicitud
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="land-footer">
        <div className="land-container land-footer-inner">
          <div className="land-footer-brand">
            <img src="/logo.jpg" alt="Marín & Abogados" />
            <div>
              <strong>MARÍN &amp; ABOGADOS</strong>
              <span>Asociados</span>
            </div>
          </div>
          <p className="land-footer-tagline">"Su salud legal, tan importante como su salud física."</p>
          <p className="land-footer-copy">© {new Date().getFullYear()} Marín &amp; Abogados Asociados. Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  );
}
