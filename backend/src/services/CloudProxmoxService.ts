import { RelayService } from './RelayService';

/**
 * Same interface as ProxmoxService but routes all calls through the relay tunnel.
 * The local agent executes the actual HTTP requests against Proxmox.
 */
export class CloudProxmoxService {
  constructor(private readonly serverID: string) {}

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const resp = await RelayService.proxy(this.serverID, { method, path, body });
    return (resp as any)?.data ?? resp as T;
  }

  getAuthData(): { host: string; ticket?: string; csrf?: string } {
    throw new Error('VNC Console not currently supported in Cloud mode. Connect locally.');
  }

  async getNodes() {
    return this.call<any[]>('GET', '/nodes');
  }

  async getVMs(node: string) {
    return this.call<any[]>('GET', `/nodes/${node}/qemu`);
  }

  async getContainers(node: string) {
    return this.call<any[]>('GET', `/nodes/${node}/lxc`);
  }

  async startVM(node: string, vmid: number) {
    return this.call('POST', `/nodes/${node}/qemu/${vmid}/status/start`);
  }

  async stopVM(node: string, vmid: number) {
    return this.call('POST', `/nodes/${node}/qemu/${vmid}/status/stop`);
  }

  async restartVM(node: string, vmid: number) {
    return this.call('POST', `/nodes/${node}/qemu/${vmid}/status/reboot`);
  }

  async startContainer(node: string, vmid: number) {
    return this.call('POST', `/nodes/${node}/lxc/${vmid}/status/start`);
  }

  async stopContainer(node: string, vmid: number) {
    return this.call('POST', `/nodes/${node}/lxc/${vmid}/status/stop`);
  }

  async restartContainer(node: string, vmid: number) {
    return this.call('POST', `/nodes/${node}/lxc/${vmid}/status/reboot`);
  }
}
