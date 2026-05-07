const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = __dirname;
const DATA_DIR = process.env.APP_DATA_DIR || path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'sistema_pedidos.sqlite');

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS configuracoes (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    responsavel_acao TEXT DEFAULT '',
    slogan_jogos TEXT DEFAULT 'Jogos com organização, cuidado e entrega no tempo certo.',
    agua_total_comprada REAL DEFAULT 0,
    agua_valor_comprado REAL DEFAULT 0,
    atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pedidos (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    data TEXT NOT NULL,
    descricao TEXT NOT NULL,
    criado_por TEXT DEFAULT '',
    status TEXT DEFAULT 'pendente',
    entregue_por TEXT DEFAULT '',
    entregue_em TEXT DEFAULT '',
    detalhes_json TEXT NOT NULL,
    atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
  );

  INSERT OR IGNORE INTO configuracoes (id) VALUES (1);
`);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...corsHeaders
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10_000_000) {
        reject(new Error('Payload muito grande.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('JSON inválido.'));
      }
    });
  });
}

function getConfiguracoes() {
  const row = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
  return {
    responsavelAcao: row.responsavel_acao || '',
    sloganJogos: row.slogan_jogos || 'Jogos com organização, cuidado e entrega no tempo certo.',
    aguaTotalComprada: Number(row.agua_total_comprada) || 0,
    aguaValorComprado: Number(row.agua_valor_comprado) || 0
  };
}

function getPedidos() {
  return db.prepare('SELECT * FROM pedidos ORDER BY data DESC').all().map((row) => ({
    id: row.id,
    tipo: row.tipo,
    data: row.data,
    descricao: row.descricao,
    criadoPor: row.criado_por || '',
    status: row.status || 'pendente',
    entreguePor: row.entregue_por || '',
    entregueEm: row.entregue_em || '',
    detalhes: JSON.parse(row.detalhes_json || '[]')
  }));
}

function savePedido(pedido) {
  db.prepare(`
    INSERT INTO pedidos (
      id, tipo, data, descricao, criado_por, status, entregue_por, entregue_em, detalhes_json, atualizado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      tipo = excluded.tipo,
      data = excluded.data,
      descricao = excluded.descricao,
      criado_por = excluded.criado_por,
      status = excluded.status,
      entregue_por = excluded.entregue_por,
      entregue_em = excluded.entregue_em,
      detalhes_json = excluded.detalhes_json,
      atualizado_em = CURRENT_TIMESTAMP
  `).run(
    pedido.id,
    pedido.tipo,
    pedido.data,
    pedido.descricao,
    pedido.criadoPor || '',
    pedido.status || 'pendente',
    pedido.entreguePor || '',
    pedido.entregueEm || '',
    JSON.stringify(pedido.detalhes || [])
  );
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/state') {
    sendJson(res, 200, {
      configuracoes: getConfiguracoes(),
      pedidos: getPedidos()
    });
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/configuracoes') {
    const body = await readBody(req);
    db.prepare(`
      UPDATE configuracoes
      SET responsavel_acao = ?,
          slogan_jogos = ?,
          agua_total_comprada = ?,
          agua_valor_comprado = ?,
          atualizado_em = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      body.responsavelAcao || '',
      body.sloganJogos ?? '',
      Number(body.aguaTotalComprada) || 0,
      Number(body.aguaValorComprado) || 0
    );
    sendJson(res, 200, getConfiguracoes());
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/pedidos') {
    const body = await readBody(req);
    const pedidos = Array.isArray(body.pedidos) ? body.pedidos : [];

    db.exec('BEGIN');
    try {
      db.prepare('DELETE FROM pedidos').run();
      pedidos.forEach(savePedido);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }

    sendJson(res, 200, { pedidos: getPedidos() });
    return;
  }

  sendJson(res, 404, { error: 'Rota não encontrada.' });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const filePath = path.resolve(ROOT, `.${requestedPath}`);

  if (!filePath.startsWith(ROOT) || filePath.startsWith(DATA_DIR)) {
    res.writeHead(403);
    res.end('Acesso negado.');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end('Arquivo não encontrado.');
      return;
    }

    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/api/')) {
      await handleApi(req, res);
      return;
    }

    serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Erro interno.' });
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`Servidor ja esta rodando em http://${HOST}:${PORT}`);
    return;
  }

  throw error;
});

server.listen(PORT, HOST, () => {
  console.log(`Sistema de pedidos rodando em http://${HOST}:${PORT}`);
  console.log(`Banco SQLite: ${DB_PATH}`);
});
