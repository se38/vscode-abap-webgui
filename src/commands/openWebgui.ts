import * as vscode from 'vscode';
import { describeDestination, readAdtDestinations } from '../adt/destinations.ts';
import type { AdtDestination } from '../adt/destinations.ts';
import { pickTarget } from '../adt/objectSelection.ts';
import { resolveEndpoint } from '../adt/webguiEndpoint.ts';
import { buildWebguiUrl } from '../webgui/urlBuilder.ts';

const LAST_DESTINATION_KEY = 'abapWebgui.lastDestination';

export async function openWebgui(context: vscode.ExtensionContext): Promise<void> {
  try {
    const destination = await pickDestination(context);
    if (!destination) {
      return;
    }
    const resolved = await resolveEndpoint(destination);
    if (!resolved) {
      return;
    }
    const target = await pickTarget();
    if (!target) {
      return;
    }
    await context.globalState.update(LAST_DESTINATION_KEY, destination.id);
    await vscode.commands.executeCommand('simpleBrowser.show', buildWebguiUrl(resolved.endpoint, target, resolved.hints));
  } catch (error) {
    void vscode.window.showErrorMessage(`ABAP: Open Webgui failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function pickDestination(context: vscode.ExtensionContext): Promise<AdtDestination | undefined> {
  const file = vscode.workspace.getConfiguration('abapWebgui').get<string>('destinationsFile');
  const destinations = await readAdtDestinations(file);
  if (destinations.length === 0) {
    throw new Error('No ADT destinations found. Create one with "ABAP: New Destination..." first.');
  }

  const last = context.globalState.get<string>(LAST_DESTINATION_KEY);
  const sorted = [...destinations].sort((a, b) => Number(b.id === last) - Number(a.id === last));
  const picked = await vscode.window.showQuickPick(
    sorted.map((d) => ({ label: d.id, description: describeDestination(d), destination: d })),
    { title: 'ABAP: Open Webgui', placeHolder: 'Select the system' },
  );
  return picked?.destination;
}
