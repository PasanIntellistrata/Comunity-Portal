import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleMcpSse, handleMcpMessages, startStdio } from './mcp.js';
import { handleChat } from './chat.js';
import { data } from './data/mock-data.js';

// Resolve directory and load environment variables from both local and root .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://qttjnrsbbsucfbbxugeu.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_il-MiYy0sjFxDWjn5ICqUg_tG9_Lv_8';

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

/**
 * Intellistrata Backend Token Authentication & User Mapping Middleware
 * Validates the Authorization: Bearer <token> against Supabase Auth,
 * extracts claims, and maps to the internal resident/manager profile.
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or malformed Authorization header. Expected: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Access token is empty.' });
  }

  // Handle mock development tokens
  if (token.startsWith('jwt_mock_') || token.startsWith('jwt_token_') || token.startsWith('mock_token_')) {
    req.user = {
      id: 'usr_dev_mock',
      name: 'Demo Resident',
      email: 'demo@intellistrata.com',
      role: 'Resident Owner',
      unit: '101',
      provider: 'mock',
    };
    return next();
  }

  try {
    // Validate live token against Supabase Auth GoTrue endpoint
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      console.warn(`[Auth] Rejected token verification with Supabase (HTTP ${response.status})`);
      return res.status(401).json({
        error: 'Invalid or expired Supabase authentication token.',
      });
    }

    const sbUser = await response.json();
    const meta = sbUser.user_metadata || {};
    const rawName = meta.full_name || meta.name || (sbUser.email ? sbUser.email.split('@')[0] : 'Resident');
    const formattedName = rawName
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    // Map Supabase identity to internal Intellistrata user record
    req.user = {
      id: sbUser.id,
      email: sbUser.email || '',
      name: formattedName || 'Resident Owner',
      role: meta.role || 'Resident Owner',
      unit: meta.unit || '101',
      provider: sbUser.app_metadata?.provider || 'email',
    };

    console.log(`[Auth] Successfully verified user: ${req.user.name} (${req.user.email}) [Role: ${req.user.role}]`);
    next();
  } catch (err) {
    console.error('[Auth] Error contacting Supabase authentication service:', err.message);
    return res.status(500).json({ error: 'Authentication service verification failed.' });
  }
}

// ==============================================================================
// Authenticated API Endpoints (Intellistrata Backend)
// ==============================================================================

// User Profile & Mapping Verification
app.get('/api/user/profile', authenticateToken, (req, res) => {
  res.json({
    status: 'success',
    user: req.user,
    mapped_account: {
      strata_plan: 'SP-54210',
      unit: req.user.unit,
      role: req.user.role,
      voting_rights: req.user.role.includes('Owner') || req.user.role.includes('Committee'),
    },
  });
});

// Announcements
app.get('/api/announcements', authenticateToken, (req, res) => {
  res.json(data.announcements);
});

// Events
app.get('/api/events', authenticateToken, (req, res) => {
  res.json(data.events);
});

// FAQs
app.get('/api/faqs', authenticateToken, (req, res) => {
  res.json(data.faqs);
});

// ==============================================================================
// AI Assistant & MCP Endpoints
// ==============================================================================

// Main chat endpoint used by the Community Portal Assistant
app.post('/chat', (req, res, next) => {
  // Pass through auth optionally if bearer token provided
  if (req.headers.authorization) {
    return authenticateToken(req, res, () => handleChat(req, res));
  }
  handleChat(req, res);
});

// Raw MCP Server endpoints (for Claude Desktop, Cursor, etc.)
app.get('/mcp', handleMcpSse);
app.post('/mcp/messages', handleMcpMessages);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mcp: 'active',
    supabase_connected_url: SUPABASE_URL,
    timestamp: new Date().toISOString(),
  });
});

// Start HTTP Server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🤖 Community Portal AI & Intellistrata Backend`);
  console.log(`========================================`);
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`🔒 Supabase URL:      ${SUPABASE_URL}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET  /api/announcements (Bearer Auth)`);
  console.log(`   GET  /api/events        (Bearer Auth)`);
  console.log(`   GET  /api/faqs          (Bearer Auth)`);
  console.log(`   GET  /api/user/profile  (Bearer Auth)`);
  console.log(`   POST /chat              (AI Chat)`);
  console.log(`   GET  /mcp               (MCP SSE Stream)`);
  console.log(`========================================`);
});

// If run with a specific flag, start stdio transport instead
if (process.argv.includes('--stdio')) {
  startStdio();
}
