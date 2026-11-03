import * as vscode from 'vscode';
import type { WebguiTarget } from '../webgui/urlBuilder.ts';

interface TargetItem extends vscode.QuickPickItem {
  target: WebguiTarget['kind'];
}

const ITEMS: TargetItem[] = [
  { target: 'base', label: '$(globe) Open Base WebGUI', description: 'SAP Easy Access' },
  { target: 'transaction', label: '$(symbol-event) Transaction…', description: 'T-code, e.g. SE38' },
  { target: 'program', label: '$(file-code) Program…', description: 'Executable report, started via SA38' },
];

/**
 * ADT exposes no search API and no session to other extensions, so the object is
 * typed in. Esc on the first pick also means "base WebGUI"; Esc on the name prompt
 * cancels the command.
 */
export async function pickTarget(): Promise<WebguiTarget | undefined> {
  const picked = await vscode.window.showQuickPick(ITEMS, {
    title: 'ABAP: Open Webgui',
    placeHolder: 'Choose what to open (Esc opens the base WebGUI)',
  });
  if (!picked || picked.target === 'base') {
    return { kind: 'base' };
  }

  const isProgram = picked.target === 'program';
  const name = await vscode.window.showInputBox({
    title: isProgram ? 'Program name' : 'Transaction code',
    prompt: 'Leave empty to open the base WebGUI',
    validateInput: (v) => (/^[A-Za-z0-9_/$%*.-]*$/.test(v.trim()) ? undefined : 'Invalid ABAP object name'),
  });
  if (name === undefined) {
    return undefined;
  }
  return name.trim() ? { kind: picked.target, name: name.trim() } : { kind: 'base' };
}
