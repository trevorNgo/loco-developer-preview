import * as vscode from "vscode";
import { DEFAULT_URL } from "./constants";
export class Controller {
  /**
   * Provides access to the Controller. Maintains Singleton Pattern. Function will bring up ReactPanel to View if Controller instance exists, otherwise will instantiate a new Controller.
   * @returns Singleton Controller type
   */
  public static getInstance(context: vscode.ExtensionContext): Controller {
    if (this._instance) {
      this._instance.showPreviewPanel();
    } else {
      this._instance = new Controller(context);
    }
    return this._instance;
  }

  /**
   * The singleton instance of Controller
   * @type: {Controller}
   */
  private static _instance: Controller;
  public static vsContext: vscode.ExtensionContext;
  private currentPanel: vscode.WebviewPanel | undefined = undefined;
  private url: string | undefined;

  private constructor(context: vscode.ExtensionContext) {
    Controller.vsContext = context;

    const settingDefinedUrl = vscode.workspace
      .getConfiguration()
      .get<string>("loco-developer-preview");

    const settingsContext: IWorkspaceSettings = {
      userDefinedUrl: settingDefinedUrl,
    };
    this.determineServerUrl(settingsContext).then(this.showPreviewPanel);
  }
  private async determineServerUrl(wsSettings: IWorkspaceSettings) {
    const inputOptions: vscode.InputBoxOptions = {
      value: wsSettings.userDefinedUrl,
      valueSelection:
        wsSettings.userDefinedUrl === DEFAULT_URL ? [17, 30] : undefined,
      validateInput: (inputStr: string) => {
        if (inputStr.startsWith("http://")) {
          return null;
        } else {
        }
      },
    };
    try {
      const result = await vscode.window.showInputBox(inputOptions);

      this.url = result || wsSettings.userDefinedUrl;
    } catch (e) {
      vscode.window.showErrorMessage(
        `Loco Developer Preview could not capture your url response.
        Using default ${wsSettings.userDefinedUrl} defined in settings.`
      );
    }
  }
  private async showPreviewPanel() {
    if (this.currentPanel) {
      this.currentPanel.reveal(vscode.ViewColumn.Two);
    }

    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    //   vscode.window.showInformationMessage(
    //   );

    this.currentPanel = vscode.window.createWebviewPanel(
      "responsivepreview", // Identifies the type of the webview. Used internally
      "Preview", // Title of the panel displayed to the user
      vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
      { enableScripts: true } // Webview options. More on these later.
    );
    this.currentPanel.webview.html = `<!DOCTYPE html>
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
        <iframe id="preview-window" src="${this.url}"> Bad link given to vscode iframe.
        </iframe>
        </body>
        </html>`;
    this.currentPanel.onDidDispose(
      () => {
        this.currentPanel = undefined;
      },
      undefined,
      Controller.vsContext.subscriptions
    );
  }
}
