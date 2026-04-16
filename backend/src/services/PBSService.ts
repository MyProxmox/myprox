import axios, { AxiosInstance } from 'axios';
import https from 'https';

interface PBSConfig {
  host: string;
  username: string; // e.g. root@pam
  password: string;
  port?: number;
}

export interface PBSDatastore {
  store: string;
  path: string;
  'disk-usage': number;
  'disk-quota': number;
  'avail': number;
  'total': number;
  'used': number;
  comment?: string;
}

export interface PBSTask {
  upid: string;
  node: string;
  type: string;
  id: string;
  status: string;
  user: string;
  starttime: number;
  endtime?: number;
}

export class PBSService {
  private client: AxiosInstance;
  private ticket = '';
  private csrfToken = '';

  private constructor(private readonly host: string, private readonly port: number) {
    this.client = axios.create({
      baseURL: `https://${host}:${port}/api2/json`,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 10000,
    });
  }

  static async create(config: PBSConfig): Promise<PBSService> {
    const svc = new PBSService(config.host, config.port ?? 8007);
    await svc.authenticate(config.username, config.password);
    return svc;
  }

  private async authenticate(username: string, password: string) {
    const params = new URLSearchParams({ username, password });
    const response = await this.client.post('/access/ticket', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const { ticket, CSRFPreventionToken } = response.data.data;
    this.ticket = ticket;
    this.csrfToken = CSRFPreventionToken;
    this.client.defaults.headers.common['Cookie'] = `PBSAuthCookie=${ticket}`;
    this.client.defaults.headers.common['CSRFPreventionToken'] = CSRFPreventionToken;
  }

  // List all datastores
  async getDatastores(): Promise<PBSDatastore[]> {
    const response = await this.client.get('/admin/datastore');
    return response.data.data ?? [];
  }

  // Get tasks (GC, prune, verify, backup) — filtered by datastore if provided
  async getTasks(store?: string, limit = 50): Promise<PBSTask[]> {
    const params: Record<string, any> = { 'limit': limit, 'typefilter': '' };
    if (store) params['store'] = store;
    const response = await this.client.get('/nodes/localhost/tasks', { params });
    return response.data.data ?? [];
  }

  // Get datastore usage / status
  async getDatastoreStatus(store: string) {
    const response = await this.client.get(`/admin/datastore/${store}/status`);
    return response.data.data;
  }

  // Get snapshots in a datastore
  async getSnapshots(store: string) {
    const response = await this.client.get(`/admin/datastore/${store}/snapshots`);
    return response.data.data ?? [];
  }
}
