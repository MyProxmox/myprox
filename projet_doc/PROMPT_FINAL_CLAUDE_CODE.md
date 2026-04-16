# 🚀 PROMPT FINAL - MyProx Phase 1 MVP

**Copie-colle ce prompt directement dans Claude Code (ou via API)**

---

## Contexte du projet

Tu développes **MyProx**, une application mobile révolutionnaire permettant de gérer les infrastructures Proxmox n'importe où dans le monde.

**Concept** : L'app fonctionne en 2 modes :
1. **Mode Local** : Gestion du Proxmox sur le réseau local uniquement
2. **Mode Cloud Premium** : Accès sécurisé via tunnel WebSocket (Phase 2)

**Tech Stack (Phase 1)** :
- **Mobile** : React Native avec Expo (compilable sur Mac M4)
- **Backend** : Node.js + Express + PostgreSQL
- **Tout tourne dans Docker** (docker-compose)
- **Monétisation** : Free (1 cloud + 5 local), Premium ($9.99/mois)

---

## Phase 1 - MVP Local (ce qu'on fait maintenant)

### Objectif
Créer une app fonctionnelle permettant :
- S'authentifier
- Configurer une connexion Proxmox locale
- Voir le dashboard avec CPU/RAM usage
- Lister les VMs/Containers
- Démarrer/Arrêter/Redémarrer les machines

**Timeline** : 7-10 jours solo

---

## Structure du projet

```
myprox/
├── mobile/               # App React Native (Expo)
├── backend/              # API Node.js
├── relay/                # Cloud Relay (Phase 2, skip pour maintenant)
├── website/              # Next.js website (optionnel Phase 1)
├── docker-compose.yml    # Dev local
├── .env.example
└── README.md
```

---

## TÂCHE 1 : Setup Initial & Scaffolding

### 1.1 - Initialiser le repo GitHub
- Repo **privé** pour l'instant
- `.gitignore` complet (node_modules, .env, builds, etc.)
- LICENSE MIT
- README basique

### 1.2 - Setup Expo + React Native
```bash
npx create-expo-app MyProx
cd MyProx
npm install axios zustand react-native-keychain @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack

# Dev
npx expo start
```

**Dépendances essentielles** :
- `axios` : HTTP client
- `zustand` : State management
- `react-native-keychain` : Stockage sécurisé (passwords)
- `@react-navigation/*` : Navigation
- `expo-secure-store` : Secure storage alternative

### 1.3 - Setup Node.js Backend
```bash
mkdir backend && cd backend
npm init -y
npm install express pg dotenv cors jsonwebtoken bcryptjs axios

# Dev tools
npm install -D typescript ts-node @types/node @types/express
```

**Structure backend** :
```
backend/
├── src/
│   ├── server.ts         # Express setup
│   ├── config/
│   │   ├── database.ts
│   │   └── env.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── servers.ts
│   │   └── vms.ts
│   ├── controllers/
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   └── utils/
│       ├── jwt.ts
│       └── encryption.ts
├── migrations/
├── Dockerfile
├── package.json
└── .env.example
```

### 1.4 - Docker Compose (dev local)

**docker-compose.yml** :
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: myprox
      POSTGRES_USER: myprox_user
      POSTGRES_PASSWORD: devpass123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://myprox_user:devpass123@postgres:5432/myprox
      JWT_SECRET: your-secret-key-min-32-chars
      NODE_ENV: development
    depends_on:
      - postgres
    volumes:
      - ./backend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

**Lancer le dev** : `docker-compose up -d`

---

## TÂCHE 2 : Authentication (Backend)

### 2.1 - Database Schema
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  plan VARCHAR DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  access_token VARCHAR UNIQUE NOT NULL,
  refresh_token VARCHAR UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR DEFAULT 'free',
  stripe_customer_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 - JWT + Password Hashing
```typescript
// backend/src/utils/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

export function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}
```

```typescript
// backend/src/utils/encryption.ts
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 2.3 - Auth Routes
```typescript
// backend/src/routes/auth.ts
import express from 'express';
import { hashPassword, verifyPassword } from '../utils/encryption';
import { generateTokens, verifyToken } from '../utils/jwt';
import { db } from '../config/database';

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, plan) VALUES ($1, $2, $3) RETURNING id, email, plan',
      [email, passwordHash, 'free']
    );

    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user.id);

    await db.query(
      'INSERT INTO sessions (user_id, access_token, refresh_token, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'7 days\')',
      [user.id, accessToken, refreshToken]
    );

    res.json({ user, accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      'SELECT id, password_hash, plan FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    await db.query(
      'INSERT INTO sessions (user_id, access_token, refresh_token, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'7 days\')',
      [user.id, accessToken, refreshToken]
    );

    res.json({ user: { id: user.id, email, plan: user.plan }, accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const decoded = verifyToken(refreshToken);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
```

---

## TÂCHE 3 : Proxmox Server Management (Backend)

### 3.1 - Database Schema
```sql
CREATE TABLE proxmox_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  mode VARCHAR DEFAULT 'local',
  local_ip VARCHAR,
  local_username VARCHAR,
  local_password_encrypted TEXT,
  verified BOOLEAN DEFAULT FALSE,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

### 3.2 - Proxmox Service (API Client)
```typescript
// backend/src/services/ProxmoxService.ts
import axios, { AxiosInstance } from 'axios';
import https from 'https';

interface ProxmoxConfig {
  host: string;
  username: string;
  password: string;
}

export class ProxmoxService {
  private client: AxiosInstance;
  private ticket?: string;

  constructor(config: ProxmoxConfig) {
    this.client = axios.create({
      baseURL: `https://${config.host}:8006/api2/json`,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    this.authenticate(config.username, config.password);
  }

  private async authenticate(username: string, password: string) {
    try {
      const response = await this.client.post('/access/ticket', {
        username,
        password,
      });
      this.ticket = response.data.data.ticket;
      this.client.defaults.headers.common['Cookie'] = `PVEAuthCookie=${this.ticket}`;
    } catch (error) {
      throw new Error('Proxmox authentication failed');
    }
  }

  async getNodes() {
    return this.client.get('/nodes');
  }

  async getVMs(node: string) {
    return this.client.get(`/nodes/${node}/qemu`);
  }

  async getContainers(node: string) {
    return this.client.get(`/nodes/${node}/lxc`);
  }

  async getVMStatus(node: string, vmid: number) {
    return this.client.get(`/nodes/${node}/qemu/${vmid}/status/current`);
  }

  async startVM(node: string, vmid: number) {
    return this.client.post(`/nodes/${node}/qemu/${vmid}/status/start`);
  }

  async stopVM(node: string, vmid: number) {
    return this.client.post(`/nodes/${node}/qemu/${vmid}/status/stop`);
  }

  async restartVM(node: string, vmid: number) {
    return this.client.post(`/nodes/${node}/qemu/${vmid}/status/reboot`);
  }
}
```

### 3.3 - Server Routes
```typescript
// backend/src/routes/servers.ts
import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../config/database';
import { ProxmoxService } from '../services/ProxmoxService';
import crypto from 'crypto';

const router = express.Router();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dev-key-min-32-characters-long!!';

function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptPassword(encrypted: string): string {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// GET /api/v1/servers
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, mode, local_ip, verified FROM proxmox_servers WHERE user_id = $1',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

// POST /api/v1/servers (Add local server)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, ip, username, password } = req.body;

    if (!name || !ip || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Test connection
    const proxmox = new ProxmoxService({
      host: ip,
      username,
      password,
    });

    const nodes = await proxmox.getNodes();

    if (!nodes.data.data) {
      return res.status(400).json({ error: 'Connection to Proxmox failed' });
    }

    const encryptedPassword = encryptPassword(password);

    const result = await db.query(
      'INSERT INTO proxmox_servers (user_id, name, mode, local_ip, local_username, local_password_encrypted, verified) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, mode',
      [req.userId, name, 'local', ip, username, encryptedPassword, true]
    );

    res.json({ server: result.rows[0], message: 'Server added successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to add server' });
  }
});

// DELETE /api/v1/servers/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'DELETE FROM proxmox_servers WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    res.json({ message: 'Server deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete server' });
  }
});

export default router;
```

---

## TÂCHE 4 : VMs Management (Backend)

### 4.1 - VMs Routes
```typescript
// backend/src/routes/vms.ts
import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../config/database';
import { ProxmoxService } from '../services/ProxmoxService';
import crypto from 'crypto';

const router = express.Router();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dev-key-min-32-characters-long!!';

function decryptPassword(encrypted: string): string {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// GET /api/v1/servers/:serverId/vms
router.get('/:serverId/vms', authMiddleware, async (req, res) => {
  try {
    const { serverId } = req.params;

    const serverResult = await db.query(
      'SELECT local_ip, local_username, local_password_encrypted FROM proxmox_servers WHERE id = $1 AND user_id = $2',
      [serverId, req.userId]
    );

    if (serverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const server = serverResult.rows[0];
    const password = decryptPassword(server.local_password_encrypted);

    const proxmox = new ProxmoxService({
      host: server.local_ip,
      username: server.local_username,
      password,
    });

    const nodesResponse = await proxmox.getNodes();
    const nodes = nodesResponse.data.data;

    let allVMs = [];
    let allContainers = [];

    for (const node of nodes) {
      const vmsResponse = await proxmox.getVMs(node.node);
      const containersResponse = await proxmox.getContainers(node.node);

      allVMs = allVMs.concat(
        vmsResponse.data.data.map((vm: any) => ({ ...vm, type: 'qemu', node: node.node }))
      );
      allContainers = allContainers.concat(
        containersResponse.data.data.map((ct: any) => ({ ...ct, type: 'lxc', node: node.node }))
      );
    }

    res.json({ vms: allVMs, containers: allContainers });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch VMs' });
  }
});

// POST /api/v1/servers/:serverId/vms/:vmid/action/:action
router.post('/:serverId/vms/:vmid/action/:action', authMiddleware, async (req, res) => {
  try {
    const { serverId, vmid, action } = req.params;
    const { type = 'qemu', node } = req.body;

    const serverResult = await db.query(
      'SELECT local_ip, local_username, local_password_encrypted FROM proxmox_servers WHERE id = $1 AND user_id = $2',
      [serverId, req.userId]
    );

    if (serverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const server = serverResult.rows[0];
    const password = decryptPassword(server.local_password_encrypted);

    const proxmox = new ProxmoxService({
      host: server.local_ip,
      username: server.local_username,
      password,
    });

    let result;
    if (type === 'qemu') {
      if (action === 'start') result = await proxmox.startVM(node, parseInt(vmid));
      else if (action === 'stop') result = await proxmox.stopVM(node, parseInt(vmid));
      else if (action === 'restart') result = await proxmox.restartVM(node, parseInt(vmid));
    }

    res.json({ message: `VM ${action} initiated`, task: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to perform action' });
  }
});

export default router;
```

---

## TÂCHE 5 : Auth Middleware & Express Setup

### 5.1 - Auth Middleware
```typescript
// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 5.2 - Express Server Setup
```typescript
// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import serverRoutes from './routes/servers';
import vmRoutes from './routes/vms';

const app = express();

app.use(express.json());
app.use(cors());

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/servers', serverRoutes);
app.use('/api/v1/servers', vmRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MyProx API running on port ${PORT}`);
});
```

---

## TÂCHE 6 : Mobile App - Auth Screen

### 6.1 - Auth Store (Zustand)
```typescript
// mobile/src/store/authStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

interface AuthState {
  isLoggedIn: boolean;
  user: any;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,
  accessToken: null,
  refreshToken: null,

  login: async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
        email,
        password,
      });

      const { user, accessToken, refreshToken } = response.data;

      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);

      set({ isLoggedIn: true, user, accessToken, refreshToken });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  register: async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/register`, {
        email,
        password,
      });

      const { user, accessToken, refreshToken } = response.data;

      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);

      set({ isLoggedIn: true, user, accessToken, refreshToken });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ isLoggedIn: false, user: null, accessToken: null, refreshToken: null });
  },

  restoreToken: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        set({ accessToken: token, isLoggedIn: true });
      }
    } catch (error) {
      console.error('Failed to restore token', error);
    }
  },
}));
```

### 6.2 - Auth Screen
```typescript
// mobile/src/screens/AuthScreen.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../store/authStore';

export const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuthStore();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      if (isSignUp) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MyProx</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleAuth}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Login'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setIsSignUp(!isSignUp)}
        disabled={loading}
      >
        <Text style={styles.toggleText}>
          {isSignUp ? 'Have an account? Login' : "Don't have an account? Sign up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#007AFF',
    fontSize: 14,
  },
});
```

---

## TÂCHE 7 : Mobile App - Dashboard & VMs

### 7.1 - Server Store
```typescript
// mobile/src/store/serverStore.ts
import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';

interface Server {
  id: string;
  name: string;
  mode: string;
  local_ip?: string;
  verified: boolean;
}

interface ServerState {
  servers: Server[];
  loading: boolean;
  fetchServers: () => Promise<void>;
  addServer: (name: string, ip: string, username: string, password: string) => Promise<void>;
  deleteServer: (id: string) => Promise<void>;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const useServerStore = create<ServerState>((set) => ({
  servers: [],
  loading: false,

  fetchServers: async () => {
    try {
      set({ loading: true });
      const token = useAuthStore.getState().accessToken;
      const response = await axios.get(`${API_URL}/api/v1/servers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ servers: response.data });
    } catch (error) {
      console.error('Failed to fetch servers', error);
    } finally {
      set({ loading: false });
    }
  },

  addServer: async (name: string, ip: string, username: string, password: string) => {
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await axios.post(
        `${API_URL}/api/v1/servers`,
        { name, ip, username, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      set((state) => ({ servers: [...state.servers, response.data.server] }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to add server');
    }
  },

  deleteServer: async (id: string) => {
    try {
      const token = useAuthStore.getState().accessToken;
      await axios.delete(`${API_URL}/api/v1/servers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state) => ({ servers: state.servers.filter((s) => s.id !== id) }));
    } catch (error) {
      throw new Error('Failed to delete server');
    }
  },
}));
```

### 7.2 - Dashboard Screen
```typescript
// mobile/src/screens/DashboardScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  Button,
} from 'react-native';
import { useServerStore } from '../store/serverStore';
import { useAuthStore } from '../store/authStore';

export const DashboardScreen = ({ navigation }: any) => {
  const { servers, loading, fetchServers } = useServerStore();
  const { logout } = useAuthStore();

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleAddServer = () => {
    navigation.navigate('OnboardingScreen');
  };

  const handleServerPress = (serverId: string) => {
    navigation.navigate('VMListScreen', { serverId });
  };

  const renderServer = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.serverCard}
      onPress={() => handleServerPress(item.id)}
    >
      <Text style={styles.serverName}>{item.name}</Text>
      <Text style={styles.serverIP}>{item.local_ip}</Text>
      <Text style={styles.serverMode}>{item.mode.toUpperCase()}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MyProx</Text>
        <Button title="Logout" onPress={logout} />
      </View>

      {servers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No servers added</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddServer}
          >
            <Text style={styles.addButtonText}>+ Add Server</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={servers}
            keyExtractor={(item) => item.id}
            renderItem={renderServer}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={fetchServers} />
            }
          />
          <TouchableOpacity
            style={styles.fab}
            onPress={handleAddServer}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  serverCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  serverName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  serverIP: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  serverMode: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
  },
});
```

---

## TÂCHE 8 : Mobile App - Add Server & VMs List

### 8.1 - Onboarding Screen (Add Server)
```typescript
// mobile/src/screens/OnboardingScreen.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useServerStore } from '../store/serverStore';

export const OnboardingScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { addServer } = useServerStore();

  const handleAddServer = async () => {
    if (!name || !ip || !username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await addServer(name, ip, username, password);
      Alert.alert('Success', 'Server added successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Proxmox Server</Text>

      <Text style={styles.label}>Server Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., HomeServer"
        value={name}
        onChangeText={setName}
        editable={!loading}
      />

      <Text style={styles.label}>IP Address</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 192.168.1.100"
        value={ip}
        onChangeText={setIp}
        editable={!loading}
      />

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., root@pam"
        value={username}
        onChangeText={setUsername}
        editable={!loading}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Proxmox password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleAddServer}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Add Server</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### 8.2 - VMs List Screen
```typescript
// mobile/src/screens/VMListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const VMListScreen = ({ route, navigation }: any) => {
  const { serverId } = route.params;
  const [vms, setVms] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vms' | 'containers'>('vms');

  const { accessToken } = useAuthStore();
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchVMs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/v1/servers/${serverId}/vms`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setVms(response.data.vms);
      setContainers(response.data.containers);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to fetch VMs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVMs();
    const interval = setInterval(fetchVMs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleVMAction = async (vmid: number, action: string, type: string, node: string) => {
    try {
      await axios.post(
        `${API_URL}/api/v1/servers/${serverId}/vms/${vmid}/action/${action}`,
        { type, node },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      Alert.alert('Success', `VM ${action} initiated`);
      fetchVMs();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Action failed');
    }
  };

  const renderVM = ({ item }: { item: any }) => (
    <View style={styles.vmCard}>
      <View style={styles.vmHeader}>
        <Text style={styles.vmName}>{item.name}</Text>
        <Text style={styles.vmStatus}>{item.status}</Text>
      </View>
      <Text style={styles.vmDetails}>ID: {item.vmid} | Node: {item.node}</Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.startBtn]}
          onPress={() => handleVMAction(item.vmid, 'start', item.type, item.node)}
        >
          <Text style={styles.actionBtnText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.stopBtn]}
          onPress={() => handleVMAction(item.vmid, 'stop', item.type, item.node)}
        >
          <Text style={styles.actionBtnText}>Stop</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.restartBtn]}
          onPress={() => handleVMAction(item.vmid, 'restart', item.type, item.node)}
        >
          <Text style={styles.actionBtnText}>Restart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const displayData = activeTab === 'vms' ? vms : containers;

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vms' && styles.activeTab]}
          onPress={() => setActiveTab('vms')}
        >
          <Text style={styles.tabText}>VMs ({vms.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'containers' && styles.activeTab]}
          onPress={() => setActiveTab('containers')}
        >
          <Text style={styles.tabText}>Containers ({containers.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : displayData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No {activeTab} found</Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => `${item.node}-${item.vmid}`}
          renderItem={renderVM}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchVMs} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  vmCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  vmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vmName: {
    fontSize: 16,
    fontWeight: '600',
  },
  vmStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
    color: '#007AFF',
  },
  vmDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  startBtn: {
    backgroundColor: '#4CAF50',
  },
  stopBtn: {
    backgroundColor: '#f44336',
  },
  restartBtn: {
    backgroundColor: '#FF9800',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
```

---

## TÂCHE 9 : Root Navigation & App.tsx

### 9.1 - Root Navigator
```typescript
// mobile/src/navigation/RootNavigator.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthScreen } from '../screens/AuthScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { VMListScreen } from '../screens/VMListScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="AuthScreen" component={AuthScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreenNavigator}
      options={{ headerShown: false }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ headerShown: false }}
    />
  </Tab.Navigator>
);

const DashboardScreenNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="DashboardMain"
      component={DashboardScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="OnboardingScreen"
      component={OnboardingScreen}
      options={{ title: 'Add Server' }}
    />
    <Stack.Screen
      name="VMListScreen"
      component={VMListScreen}
      options={({ route }: any) => ({ title: 'VMs' })}
    />
  </Stack.Navigator>
);

export const RootNavigator = () => {
  const { isLoggedIn, restoreToken } = useAuthStore();

  useEffect(() => {
    restoreToken();
  }, []);

  return (
    <NavigationContainer>
      {isLoggedIn ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
```

### 9.2 - App.tsx
```typescript
// mobile/src/App.tsx
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  return <RootNavigator />;
}
```

### 9.3 - app.json (Expo Config)
```json
{
  "expo": {
    "name": "MyProx",
    "slug": "myprox",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTabletMode": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "apiUrl": "http://localhost:3000"
    },
    "plugins": [
      [
        "react-native-keychain",
        {
          "Capabilities.entitlements": {
            "keychain-access-groups": [
              "$(AppIdentifierPrefix)com.myprox"
            ]
          }
        }
      ]
    ]
  }
}
```

---

## TÂCHE 10 : Settings Screen & Final Polish

### 10.1 - Settings Screen
```typescript
// mobile/src/screens/SettingsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';

export const SettingsScreen = () => {
  const { logout, user } = useAuthStore();
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Logout',
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.item}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.label}>Plan</Text>
          <Text style={styles.value}>{user?.plan || 'free'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Info</Text>
        <View style={styles.item}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 15,
    marginBottom: 10,
    color: '#333',
  },
  item: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    margin: 20,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

## WORKFLOW FINAL

### Lancer tout localement

```bash
# Terminal 1 : Docker services
docker-compose up -d

# Terminal 2 : Expo (mobile app)
cd mobile
npm install
npx expo start

# Terminal 3 : Test API
curl http://localhost:3000/api/v1/health
```

### Tester l'app
1. Installer Expo Go sur ton téléphone
2. Scanner le QR code depuis le terminal Expo
3. Créer un compte
4. Ajouter un serveur Proxmox local
5. Voir les VMs et contrôler leur état

---

## 📋 Checklist de Validation

- [ ] Repo GitHub créé et fonctionnel
- [ ] Docker-compose up -d = OK
- [ ] API health check = 200
- [ ] PostgreSQL accessible
- [ ] Expo app compile sans erreur
- [ ] Registration/Login fonctionne
- [ ] Ajouter un serveur Proxmox fonctionne
- [ ] Voir la liste des VMs = OK
- [ ] Start/Stop actions = OK
- [ ] Logout déconnecte = OK

---

**Commence par la TÂCHE 1 (scaffolding). Une fois que tu as validé l'architecture, on passe aux tâches 2-10 progressivement.**

**Besoin d'aide ? Demande clarification sur n'importe quelle tâche.**
