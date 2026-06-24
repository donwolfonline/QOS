/**
 * ConnectionService — browser WebSocket client for Q-OS daemon.
 * Handles reconnection, message queuing, and browser CORS constraints.
 */

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface TelemetryFrame {
  type: 'telemetry';
  ts: number;
  metrics: Record<string, number>;
  logs: Array<{ level: string; target: string; message: string }>;
  node_id: string;
  mesh_id: string;
}

export interface StateFrame {
  type: 'state_delta';
  ts: number;
  key: string;
  namespace: string;
  vector_clock: Record<string, number>;
  last_modified: number;
}

export type QosFrame = TelemetryFrame | StateFrame;

type Listener<T> = (event: T) => void;

class EventEmitter<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<Listener<unknown>>>();

  on<K extends keyof Events>(event: K, cb: Listener<Events[K]>) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb as Listener<unknown>);
    return () => this.off(event, cb);
  }

  off<K extends keyof Events>(event: K, cb: Listener<Events[K]>) {
    this.listeners.get(event)?.delete(cb as Listener<unknown>);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }
}

interface ServiceEvents {
  status: ConnectionStatus;
  frame: QosFrame;
  error: Error;
  [key: string]: unknown;
}

export class ConnectionService extends EventEmitter<ServiceEvents> {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private readonly maxDelay = 30000;
  private status: ConnectionStatus = 'disconnected';
  private destroyed = false;
  
  private targetIp: string | null = null;
  private token: string | null = null;

  constructor() {
    super();
  }

  /**
   * Initialize a new connection to a target IP with the specified token.
   * Persists to sessionStorage.
   */
  connectTo(ip: string, token: string) {
    this.targetIp = ip;
    this.token = token;
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('qos_target_ip', ip);
      sessionStorage.setItem('qos_auth_token', token);
    }
    
    this.reconnectDelay = 1000;
    this.destroyed = false;
    this.connect();
  }

  connect() {
    if (this.destroyed) return;

    // Load from sessionStorage if not currently set
    if (!this.targetIp || !this.token) {
      if (typeof window !== 'undefined') {
        this.targetIp = sessionStorage.getItem('qos_target_ip');
        this.token = sessionStorage.getItem('qos_auth_token');
      }
    }

    // Fallback to defaults for initial development
    if (!this.targetIp) this.targetIp = '127.0.0.1';
    if (!this.token) {
      // If no token is provided and none in session, we cannot connect securely
      this.setStatus('disconnected');
      return;
    }

    this.setStatus('connecting');

    try {
      // Append token as query parameter to bypass WebSocket header limitations in browsers
      const url = `ws://${this.targetIp}:3000/api/v1/stream?token=${encodeURIComponent(this.token)}`;
      this.ws = new WebSocket(url);
    } catch (err) {
      this.handleError(err as Error);
      return;
    }

    this.ws.onopen = () => {
      this.reconnectDelay = 1000; // reset exponential back-off
      this.setStatus('connected');
    };

    this.ws.onmessage = (ev) => {
      try {
        const frame: QosFrame = JSON.parse(ev.data as string);
        this.emit('frame', frame);
      } catch {
        // ignore malformed frames
      }
    };

    this.ws.onerror = (ev) => {
      this.handleError(new Error('WebSocket connection error'));
    };

    this.ws.onclose = () => {
      if (!this.destroyed) this.scheduleReconnect();
      else this.setStatus('disconnected');
    };
  }

  disconnect() {
    this.destroyed = true;
    this.clearReconnect();
    this.ws?.close();
    this.ws = null;
    this.setStatus('disconnected');
    
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('qos_target_ip');
      sessionStorage.removeItem('qos_auth_token');
    }
  }

  private scheduleReconnect() {
    this.clearReconnect();
    this.setStatus('connecting');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxDelay);
      this.connect();
    }, this.reconnectDelay);
  }

  private clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private handleError(err: Error) {
    this.setStatus('error');
    this.emit('error', err);
    this.scheduleReconnect();
  }

  private setStatus(s: ConnectionStatus) {
    this.status = s;
    this.emit('status', s);
  }

  getStatus() {
    return this.status;
  }
}

/** Singleton connection service for use in React context */
export const connectionService = new ConnectionService();
