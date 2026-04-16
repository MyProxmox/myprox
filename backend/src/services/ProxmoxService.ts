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
  private csrfToken?: string;

  private constructor(host: string) {
    this.client = axios.create({
      baseURL: `https://${host}:8006/api2/json`,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 10000,
    });
  }

  // Factory method to handle async authentication cleanly
  static async create(config: ProxmoxConfig): Promise<ProxmoxService> {
    const service = new ProxmoxService(config.host);
    await service.authenticate(config.username, config.password);
    return service;
  }

  private async authenticate(username: string, password: string): Promise<void> {
    const params = new URLSearchParams({ username, password });
    const response = await this.client.post('/access/ticket', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const data = response.data.data;
    this.ticket = data.ticket;
    this.csrfToken = data.CSRFPreventionToken;
    this.client.defaults.headers.common['Cookie'] = `PVEAuthCookie=${this.ticket}`;
    this.client.defaults.headers.common['CSRFPreventionToken'] = this.csrfToken;
  }

  async getNodes() {
    const response = await this.client.get('/nodes');
    return response.data.data;
  }

  async getVMs(node: string) {
    const response = await this.client.get(`/nodes/${node}/qemu`);
    return response.data.data;
  }

  async getContainers(node: string) {
    const response = await this.client.get(`/nodes/${node}/lxc`);
    return response.data.data;
  }

  async startVM(node: string, vmid: number) {
    const response = await this.client.post(`/nodes/${node}/qemu/${vmid}/status/start`);
    return response.data.data;
  }

  async stopVM(node: string, vmid: number) {
    const response = await this.client.post(`/nodes/${node}/qemu/${vmid}/status/stop`);
    return response.data.data;
  }

  async restartVM(node: string, vmid: number) {
    const response = await this.client.post(`/nodes/${node}/qemu/${vmid}/status/reboot`);
    return response.data.data;
  }

  async startContainer(node: string, vmid: number) {
    const response = await this.client.post(`/nodes/${node}/lxc/${vmid}/status/start`);
    return response.data.data;
  }

  async stopContainer(node: string, vmid: number) {
    const response = await this.client.post(`/nodes/${node}/lxc/${vmid}/status/stop`);
    return response.data.data;
  }

  async restartContainer(node: string, vmid: number) {
    const response = await this.client.post(`/nodes/${node}/lxc/${vmid}/status/reboot`);
    return response.data.data;
  }

  async deleteVM(node: string, vmid: number) {
    const response = await this.client.delete(`/nodes/${node}/qemu/${vmid}`);
    return response.data.data;
  }

  async deleteContainer(node: string, vmid: number) {
    const response = await this.client.delete(`/nodes/${node}/lxc/${vmid}`);
    return response.data.data;
  }
}
