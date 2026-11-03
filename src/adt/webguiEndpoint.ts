import * as vscode from 'vscode';
import { icmPortFor, parseEndpoint } from '../webgui/urlBuilder.ts';
import type { WebguiEndpoint, WebguiLogonHints } from '../webgui/urlBuilder.ts';
import type { AdtDestination } from './destinations.ts';

export interface ResolvedWebgui {
  endpoint: WebguiEndpoint;
  hints: WebguiLogonHints;
}

/**
 * RFC destinations carry no HTTP port, so the address comes from the
 * 'abapWebgui.systems' setting; if missing it is proposed once and saved.
 */
export async function resolveEndpoint(destination: AdtDestination): Promise<ResolvedWebgui | undefined> {
  const config = vscode.workspace.getConfiguration('abapWebgui');
  const protocol = config.get<'http' | 'https'>('defaultProtocol', 'https');
  const { client, language, webGuiServer, webGuiSaml2 } = destination.properties ?? {};
  const saved = config.get<Record<string, string>>('systems', {})[destination.id];

  // Order: "webGuiServer" in ADT's destinations.json, then the setting, then ask once.
  let endpoint = (webGuiServer ? parseEndpoint(webGuiServer, protocol) : undefined) ?? (saved ? parseEndpoint(saved, protocol) : undefined);
  if (!endpoint) {
    const answer = await vscode.window.showInputBox({
      title: `WebGUI address for ${destination.id}`,
      prompt: 'Address of the ICM that serves WebGUI (not the SAProuter string). Saved to the "abapWebgui.systems" setting.',
      value: proposeAddress(destination, protocol),
      ignoreFocusOut: true,
      validateInput: (v) => (parseEndpoint(v, protocol) ? undefined : 'Enter a host, optionally with protocol and port'),
    });
    if (answer === undefined) {
      return undefined;
    }
    endpoint = parseEndpoint(answer, protocol)!;
    const systems = { ...config.get<Record<string, string>>('systems', {}), [destination.id]: answer.trim() };
    await config.update('systems', systems, vscode.ConfigurationTarget.Global);
  }

  return { endpoint, hints: { client, language, saml2: webGuiSaml2 || undefined } };
}

function proposeAddress(destination: AdtDestination, protocol: 'http' | 'https'): string {
  const p = destination.properties ?? {};
  const host = p.applicationServer ?? p.messageServer ?? p.host ?? '';
  const port = icmPortFor(protocol, p.systemNumber ?? '');
  return host ? `${protocol}://${host}${port ? `:${port}` : ''}` : `${protocol}://`;
}
