const db = require('../config/db');

// Empresas que el usuario puede ver: array de ids, o null si puede ver todas.
async function getAllowedCompanyIds(user) {
  if (user.role === 'cliente') return [user.company_id];
  if (user.role === 'steven_marin') return null;
  const [[u]] = await db.query('SELECT all_companies FROM users WHERE id = ?', [user.id]);
  if (!u) return [];
  if (u.all_companies) return null;
  const [rows] = await db.query('SELECT company_id FROM user_company_access WHERE user_id = ?', [user.id]);
  return rows.map(r => r.company_id);
}

async function canAccessCompany(user, companyId) {
  const allowed = await getAllowedCompanyIds(user);
  return allowed === null || allowed.includes(Number(companyId));
}

// Guarda el acceso de un usuario: todas las empresas, o solo las de la lista.
async function setUserCompanies(userId, allCompanies, companyIds) {
  await db.query('UPDATE users SET all_companies = ? WHERE id = ?', [allCompanies ? 1 : 0, userId]);
  await db.query('DELETE FROM user_company_access WHERE user_id = ?', [userId]);
  if (allCompanies) return;
  for (const cid of companyIds) {
    await db.query('INSERT IGNORE INTO user_company_access (user_id, company_id) VALUES (?, ?)', [userId, cid]);
  }
}

// Valida all_companies / company_ids recibidos del frontend según quién hace la petición.
// Devuelve { all, ids } o { error }.
async function validateCompanyAccess(requester, allCompanies, companyIds) {
  const all = Boolean(allCompanies);
  if (!Array.isArray(companyIds)) return { error: 'company_ids debe ser una lista' };
  const ids = all ? [] : [...new Set(companyIds.map(Number))];
  if (ids.some(id => !Number.isInteger(id) || id <= 0)) return { error: 'Empresa no válida' };
  if (!all && ids.length === 0) return { error: 'Selecciona al menos una empresa' };

  // Una Abogada Líder con acceso restringido no puede dar acceso a empresas que ella no ve
  const allowed = await getAllowedCompanyIds(requester);
  if (allowed !== null) {
    if (all) return { error: 'No puedes asignar acceso a todas las empresas' };
    if (ids.some(id => !allowed.includes(id))) return { error: 'No puedes asignar empresas a las que no tienes acceso' };
  }
  return { all, ids };
}

module.exports = { getAllowedCompanyIds, canAccessCompany, setUserCompanies, validateCompanyAccess };
