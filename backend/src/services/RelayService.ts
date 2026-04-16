import axios from 'axios';

const RELAY_URL = process.env.RELAY_URL || 'http://relay:8080';
const API_RELAY_SECRET = process.env.API_RELAY_SECRET || '';

interface ProxyRequest {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export class RelayService {
  /**
   * Proxy an HTTP request to Proxmox via the local agent tunnel.
   */
  static async proxy(serverID: string, req: ProxyRequest): Promise<unknown> {
    const response = await axios.post(
      `${RELAY_URL}/proxy/${serverID}`,
      req,
      {
        headers: {
          Authorization: `Bearer ${API_RELAY_SECRET}`,
          'Content-Type': 'application/json',
        },
        timeout: 35_000,
      }
    );
    return response.data;
  }

  /**
   * Check if the local agent for a server is currently connected.
   */
  static async isAgentConnected(serverID: string): Promise<boolean> {
    try {
      const { data } = await axios.get(`${RELAY_URL}/status/${serverID}`, {
        timeout: 5_000,
      });
      return data.connected === true;
    } catch {
      return false;
    }
  }
}
