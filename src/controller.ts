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
  private static _instance: Controller | undefined;
  public static vsContext: vscode.ExtensionContext;
  public static wsSettings: IWorkspaceSettings;
  private currentPanel: vscode.WebviewPanel | undefined = undefined;
  private url: string | undefined;

  private constructor(context: vscode.ExtensionContext) {
    Controller.vsContext = context;

    this.setServerUrlAndShowRefreshPage(this.getWorkspaceConfig());
  }
  private getWorkspaceConfig(): IWorkspaceSettings {
    const settingDefinedUrl = vscode.workspace
      .getConfiguration()
      .get<string>("LDP.locoDevPreviewExtension.defaultUrl");
    const httpLocalhostRestriction = vscode.workspace
      .getConfiguration()
      .get<boolean>("LDP.locoDevPreviewExtension.restrictToHttp");

    const wsSettings = {
      userDefinedUrl: settingDefinedUrl,
      httpLocalhostRestriction,
    };
    Controller.wsSettings = wsSettings;
    return wsSettings;
  }
  public async setServerUrlAndShowRefreshPage(
    workspaceSettings?: IWorkspaceSettings
  ) {
    const config: IWorkspaceSettings = workspaceSettings
      ? workspaceSettings
      : Controller.wsSettings
      ? Controller.wsSettings
      : this.getWorkspaceConfig();

    const inputOptions: vscode.InputBoxOptions = {
      title: "Http Full Url",
      value: config.userDefinedUrl,
      valueSelection:
        config.userDefinedUrl === DEFAULT_URL ? [17, 30] : undefined,
      validateInput: (inputStr: string) => {
        if (inputStr.startsWith("http://localhost")) {
          return null;
        } else if (
          !config.httpLocalhostRestriction &&
          (inputStr.startsWith("http://") || inputStr.startsWith("https://"))
        ) {
          return null;
        } else {
          return "Url must start 'http://' (no TLS) afterall this is a previewer for local dev servers. If you want to remove this restriction go to vscode settings -> Extensions -> LDP -> Restrict Http";
        }
      },
    };
    const defaultMessage = `Using default '${config.userDefinedUrl}' defined in settings.`;
    try {
      const result = await vscode.window.showInputBox(inputOptions);
      if (result === undefined) {
        this.dispose();
      } else if (result.trim() === "") {
        vscode.window.showInformationMessage(defaultMessage);
      }
      this.url = result || config.userDefinedUrl;
    } catch (e) {
      console.log("bye");
      vscode.window.showErrorMessage(
        `Loco Developer Preview could not capture your url response. ` +
          defaultMessage
      );
    }
  }
  private async showPreviewPanel(): Promise<void> {
    if (this.currentPanel) {
      this.currentPanel.reveal(vscode.ViewColumn.Two);
    }

    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    //   vscode.window.showInformationMessage(
    //   );
    else {
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
    }
    this.currentPanel.onDidDispose(
      () => {
        this.currentPanel = undefined;
      },
      undefined,
      Controller.vsContext.subscriptions
    );
  }
  public dispose(): void {
    Controller._instance = undefined;
  }
}
