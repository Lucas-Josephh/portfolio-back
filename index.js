require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const TABLES = {
  project: { idKey: 'id_project' },
  skill: { idKey: 'id_skill' }
};

// Configuration Pool optimisée pour Vercel (serverless)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 0
});

// SUPPRIMÉ : la connexion au démarrage ne fonctionne pas en serverless
// pool.query('SELECT 1').then(res => console.log(res.rows)).catch(err => console.error(err));

app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://localhost:3000',
    'https://Lucas-Josephh.github.io'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const normalizeTechnologies = (tech) => {
  if (Array.isArray(tech)) return tech.map(t => String(t).trim()).filter(Boolean);
  if (typeof tech === 'string') return tech.split(',').map(t => t.trim()).filter(Boolean);
  return [];
};

const clampPercent = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
};

const getTableMeta = (tableName) => {
  if (!tableName || !(tableName in TABLES)) return { error: 'Table inconnue. Utiliser project ou skill.' };
  return { meta: TABLES[tableName] };
};

// Route racine
app.get('/', (_req, res) => {
  res.json({ 
    message: 'Portfolio API', 
    version: '1.0.0',
    endpoints: {
      health: '/health',
      getData: '/getData?table=project|skill&id=optional',
      addData: 'POST /addData',
      updateData: 'PUT /updateData',
      deleteData: 'DELETE /deleteData'
    }
  });
});

app.get('/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT 1');
    console.log('DB response:', result.rows);
    res.json({ 
      status: 'ok', 
      database: 'connected',
      date: new Date().toISOString() 
    });
  } catch (err) {
    console.error('Healthcheck failed', err);
    res.status(500).json({ 
      error: 'DB unreachable', 
      details: err.message 
    });
  }
});

app.get('/getData', async (req, res) => {
  const { table: tableName, id } = req.query;
  const { error, meta } = getTableMeta(tableName);
  if (error) return res.status(400).json({ error });

  try {
    let result;
    if (id !== undefined) {
      result = await pool.query(
        `SELECT * FROM ${tableName} WHERE ${meta.idKey} = $1`,
        [Number(id)]
      );
    } else {
      const orderColumn = tableName === 'project' ? 'created_at' : 'id_skill';
      result = await pool.query(`SELECT * FROM ${tableName} ORDER BY ${orderColumn} DESC`);
    }
    res.json(result.rows);
  } catch (err) {
    console.error('GET error', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des données.' });
  }
});

app.post('/addData', async (req, res) => {
  const { table: tableName, data } = req.body || {};
  const { error, meta } = getTableMeta(tableName);
  if (error) return res.status(400).json({ error });
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Payload "data" manquant ou invalide.' });

  try {
    if (tableName === 'project') {
      const technologies = normalizeTechnologies(data.technologie);
      const url = (data.url ?? '').toString().trim();
      const result = await pool.query(
        `INSERT INTO project (title,status,description,url,technologie,demo,github)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [data.title, data.status, data.description, url, technologies, data.demo || '', data.github || '']
      );
      return res.status(201).json(result.rows[0]);
    }

    if (tableName === 'skill') {
      const result = await pool.query(
        `INSERT INTO skill (name,categorie,level) VALUES ($1,$2,$3) RETURNING *`,
        [data.name, data.categorie, clampPercent(data.level)]
      );
      return res.status(201).json(result.rows[0]);
    }

    return res.status(400).json({ error: 'Table inconnue.' });
  } catch (err) {
    console.error('POST error', err);
    if (tableName === 'project' && err && err.code === '23505') {
      return res.status(409).json({ error: 'Un projet avec ce titre existe déjà.' });
    }
    res.status(500).json({ error: 'Erreur lors de la création.' });
  }
});

app.put('/updateData', async (req, res) => {
  const { table: tableName, id, data } = req.body || {};
  const { error, meta } = getTableMeta(tableName);
  if (error) return res.status(400).json({ error });
  if (id === undefined) return res.status(400).json({ error: 'Champ "id" requis.' });
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Payload "data" manquant ou invalide.' });

  try {
    if (tableName === 'project') {
      const technologies = normalizeTechnologies(data.technologie);
      const url = (data.url ?? '').toString().trim();
      const result = await pool.query(
        `UPDATE project SET title=$1,status=$2,description=$3,url=$4,technologie=$5,demo=$6,github=$7
         WHERE ${meta.idKey}=$8 RETURNING *`,
        [data.title,data.status,data.description,url,technologies,data.demo||'',data.github||'',Number(id)]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: 'Entrée introuvable.' });
      return res.json(result.rows[0]);
    }

    if (tableName === 'skill') {
      const result = await pool.query(
        `UPDATE skill SET name=$1,categorie=$2,level=$3 WHERE ${meta.idKey}=$4 RETURNING *`,
        [data.name,data.categorie,clampPercent(data.level),Number(id)]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: 'Entrée introuvable.' });
      return res.json(result.rows[0]);
    }

    return res.status(400).json({ error: 'Table inconnue.' });
  } catch (err) {
    console.error('PUT error', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
});

app.delete('/deleteData', async (req, res) => {
  const { table: tableName, id } = req.body || {};
  const { error, meta } = getTableMeta(tableName);
  if (error) return res.status(400).json({ error });
  if (id === undefined) return res.status(400).json({ error: 'Champ "id" requis.' });

  try {
    const result = await pool.query(
      `DELETE FROM ${tableName} WHERE ${meta.idKey}=$1`,
      [Number(id)]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: `Entrée ${id} introuvable pour ${tableName}.` });
    res.json({ success: true, removedId: Number(id) });
  } catch (err) {
    console.error('DELETE error', err);
    res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
});

app.use((err, _req, res, _next) => {
  console.error('Erreur serveur', err);
  res.status(500).json({ error: 'Erreur serveur' });
});

// Ne lance le serveur qu'en développement local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`API portfolio locale sur http://localhost:${PORT}`));
}

module.exports = app;