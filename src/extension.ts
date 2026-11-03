import * as vscode from 'vscode';
import { openWebgui } from './commands/openWebgui.ts';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(vscode.commands.registerCommand('abap.openWebgui', () => openWebgui(context)));
}

export function deactivate(): void {}
