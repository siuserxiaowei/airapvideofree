/**
 * HiAPI provider — unified async task API for image / video models.
 * @docs https://www.hiapi.ai/docs/async-api/
 *
 *   POST /v1/tasks        { model, input }        -> { data: { taskId } }
 *   GET  /v1/tasks/:id                            -> { data: { status, output[], error } }
 *
 * Status: queued | handling | archiving (in progress), success | fail (terminal).
 * Credits are pre-deducted on create and refunded by HiAPI when a task fails.
 */

export type HiapiTaskState = 'pending' | 'success' | 'fail';

export interface HiapiTaskResult {
  state: HiapiTaskState;
  /** raw HiAPI status string */
  status: string;
  /** output file URLs on success */
  urls: string[];
  /** error message on fail */
  error?: string;
}

export interface HiapiConfigs {
  apiKey: string;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://api.hiapi.ai';
const REQUEST_TIMEOUT_MS = 30_000;

export class HiapiProvider {
  readonly name = 'hiapi';
  private apiKey: string;
  private baseUrl: string;

  constructor(configs: HiapiConfigs) {
    if (!configs.apiKey) throw new Error('HiAPI api key is required');
    this.apiKey = configs.apiKey;
    this.baseUrl = (configs.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  }

  private async request(path: string, init?: RequestInit): Promise<any> {
    const resp = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const text = await resp.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // non-JSON body
    }
    if (!resp.ok) {
      const msg =
        json?.error?.message ||
        json?.message ||
        json?.error_code ||
        `HiAPI request failed with status ${resp.status}`;
      throw new Error(String(msg).slice(0, 300));
    }
    return json;
  }

  /**
   * Create a task. `idempotencyKey` makes retries return the same taskId
   * instead of charging twice.
   */
  async createTask(params: {
    model: string;
    input: Record<string, unknown>;
    idempotencyKey?: string;
  }): Promise<string> {
    const json = await this.request('/v1/tasks', {
      method: 'POST',
      body: JSON.stringify({ model: params.model, input: params.input }),
      headers: params.idempotencyKey
        ? { 'Idempotency-Key': params.idempotencyKey.slice(0, 255) }
        : undefined,
    });
    const taskId = json?.data?.taskId;
    if (!taskId) throw new Error('HiAPI did not return a taskId');
    return String(taskId);
  }

  async getTask(taskId: string): Promise<HiapiTaskResult> {
    const json = await this.request(`/v1/tasks/${encodeURIComponent(taskId)}`);
    const data = json?.data || {};
    const status = String(data.status || '');

    if (status === 'success') {
      return { state: 'success', status, urls: extractUrls(data.output) };
    }
    if (status === 'fail') {
      const err = data.error;
      const message =
        (typeof err === 'string' ? err : err?.message || err?.code) ||
        'Generation failed';
      return { state: 'fail', status, urls: [], error: String(message) };
    }
    return { state: 'pending', status, urls: [] };
  }
}

function extractUrls(output: unknown): string[] {
  const list = Array.isArray(output) ? output : output ? [output] : [];
  const urls: string[] = [];
  for (const item of list) {
    if (typeof item === 'string' && /^https?:\/\//.test(item)) urls.push(item);
    else if (item && typeof item === 'object') {
      const url = (item as any).url;
      if (typeof url === 'string' && /^https?:\/\//.test(url)) urls.push(url);
    }
  }
  return urls;
}
