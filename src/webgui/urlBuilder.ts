export type WebguiTarget =
  | { kind: 'base' }
  | { kind: 'transaction'; name: string }
  | { kind: 'program'; name: string };

export interface WebguiEndpoint {
  protocol: 'http' | 'https';
  host: string;
  port?: number;
}

export interface WebguiLogonHints {
  client?: string;
  language?: string;
  saml2?: string;
}

const WEBGUI_PATH = '/sap/bc/gui/sap/its/webgui';
const DEFAULT_PORTS = { http: 80, https: 443 } as const;

export function buildWebguiUrl(
  endpoint: WebguiEndpoint,
  target: WebguiTarget = { kind: 'base' },
  hints: WebguiLogonHints = {},
): string {
  const params: string[] = [];

  if (target.kind === 'transaction') {
    params.push(`~transaction=${encodeURIComponent(target.name.trim().toUpperCase())}`);
  } else if (target.kind === 'program') {
    // SA38 with the report name pre-filled and "start" (STRT) pressed.
    const program = target.name.trim().toUpperCase();
    params.push(`~transaction=${encodeURIComponent(`*SA38 RS38M-PROGRAMM=${program};DYNP_OKCODE=STRT`)}`);
  }
  if (hints.client) {
    params.push(`sap-client=${encodeURIComponent(hints.client)}`);
  }
  if (hints.language) {
    params.push(`sap-language=${encodeURIComponent(hints.language)}`);
  }
  if (hints.saml2) {
    params.push(`SAML2=${encodeURIComponent(hints.saml2)}`);
  }

  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return `${originOf(endpoint)}${WEBGUI_PATH}${query}`;
}

function originOf({ protocol, host, port }: WebguiEndpoint): string {
  const portPart = port !== undefined && port !== DEFAULT_PORTS[protocol] ? `:${port}` : '';
  return `${protocol}://${host}${portPart}`;
}

/** Splits e.g. "https://host:44300" or "host:8000" into an endpoint; undefined if invalid. */
export function parseEndpoint(input: string, fallbackProtocol: 'http' | 'https' = 'https'): WebguiEndpoint | undefined {
  const trimmed = input.trim();
  if (!trimmed) {
    return undefined;
  }
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `${fallbackProtocol}://${trimmed}`;
  try {
    const url = new URL(withScheme);
    const protocol = url.protocol.replace(':', '');
    if ((protocol !== 'http' && protocol !== 'https') || !url.hostname) {
      return undefined;
    }
    return { protocol, host: url.hostname, port: url.port ? Number(url.port) : undefined };
  } catch {
    return undefined;
  }
}

/** Standard ICM port convention: 80<sysnr> for HTTP, 443<sysnr> for HTTPS. */
export function icmPortFor(protocol: 'http' | 'https', systemNumber: string): number | undefined {
  if (!/^\d{2}$/.test(systemNumber)) {
    return undefined;
  }
  return Number(`${protocol === 'https' ? '443' : '80'}${systemNumber}`);
}
