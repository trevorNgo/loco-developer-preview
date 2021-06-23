import * as vscode from "vscode";
import { Controller } from "./controller";
// this method is called when the extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('"loco developer preview" is now active!');

  let launch = vscode.commands.registerCommand(
    "locoDeveloperPreviewExtension.launch",
    () => {
      Controller.getInstance(context).then((ext) => ext?.showPreviewPanel());
    }
  );
  let changeUrl = vscode.commands.registerCommand(
    "locoDeveloperPreviewExtension.changeUrl",
    () => {
      Controller.getInstance(context).then((ext) =>
        ext?.setServerUrlAndShowRefreshPage()
      );
    }
  );

  context.subscriptions.push(launch);
  context.subscriptions.push(changeUrl);
}

// this method is called when your extension is deactivated
export function deactivate(context: vscode.ExtensionContext) {
  Controller.getInstance(context).then((ext) => ext?.dispose());
}
