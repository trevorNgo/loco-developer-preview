// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('"responsivepreview" is now active!');
  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let newCommand = vscode.commands.registerCommand(
    "responsivepreview.launch",
    async () => {
      if (currentPanel) {
        currentPanel.reveal(vscode.ViewColumn.Beside);
      } else {
        const result = await vscode.window.showInputBox({
          value: "http://localhost:3000",
          valueSelection: [17, 30],
        });

        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        //   vscode.window.showInformationMessage(
        //     `"Hello World from ResponsivePreview!" ${result}`
        //   );

        currentPanel = vscode.window.createWebviewPanel(
          "responsivepreview", // Identifies the type of the webview. Used internally
          "Preview", // Title of the panel displayed to the user
          vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
          { enableScripts: true } // Webview options. More on these later.
        );
        currentPanel.webview.html = `<!DOCTYPE html>
	  <html lang="en">
	  <head>
		  <meta charset="UTF-8">
		  <meta name="viewport" content="width=device-width, initial-scale=1.0">
		  <title>Preview Window Inside VsCode</title>
		  <style>
		 	html, body {
				 width:100%;
				 height:100%;
				 padding: 0px 0px;
			 }
			 iframe {
				 height:100%;
				 width: 100%;
			 }
		  </style>
	  </head>
	  <body>
	  <iframe id="preview-window" src="${result}"> Bad link given to vscode iframe.
	  </iframe>
	  </body>
	  </html>`;
        currentPanel.onDidDispose(
          () => {
            currentPanel = undefined;
          },
          undefined,
          context.subscriptions
        );
      }
    }
  );

  context.subscriptions.push(newCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {}
