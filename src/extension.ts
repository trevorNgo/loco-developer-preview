import * as vscode from "vscode";
import { Controller } from "./controller";
// this method is called when the extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('"loco developer preview" is now active!');

  let newCommand = vscode.commands.registerCommand(
    "loco-developer-preview.launch",
    () => {
      Controller.getInstance(context);
    }
  );

  context.subscriptions.push(newCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {}
