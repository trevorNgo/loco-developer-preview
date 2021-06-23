import * as vscode from "vscode";
import { DEFAULT_URL } from "./constants";
export class Controller {
  /**
   * Provides access to the Controller. Maintains Singleton Pattern. Function will bring up ReactPanel to View if Controller instance exists, otherwise will instantiate a new Controller.
   * @returns Singleton Controller type if additional action should be taken
   */
  public static async getInstance(
    context: vscode.ExtensionContext
  ): Promise<Controller | undefined> {
    if (!this._instance) {
      this._instance = new Controller(context);
      await this._instance.setServerUrlAndShowRefreshPage();
      return;
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
    this;
  }

  public getWorkspaceConfig(): IWorkspaceSettings {
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

  /**
   * Used for setting URL of a [non]existing preview window
   * @type: {Controller}
   */
  public async setServerUrlAndShowRefreshPage(
    workspaceSettings?: IWorkspaceSettings,
    attemptFastRefresh?: boolean
  ) {
    await this.promptForServerUrl(workspaceSettings);
    await this.showPreviewPanel(attemptFastRefresh);
  }

  private async promptForServerUrl(workspaceSettings?: IWorkspaceSettings) {
    const inputOptions: vscode.InputBoxOptions =
      this.configureInputOptions(workspaceSettings);
    const defaultMessage = `Using default '${
      workspaceSettings?.userDefinedUrl || DEFAULT_URL
    }' url defined in settings.`;
    try {
      let result = await vscode.window.showInputBox(inputOptions);
      if (result === undefined) {
        return;
      } else if (result.trim() === "") {
        vscode.window.showInformationMessage(defaultMessage);
      } else if (!result.startsWith("http")) {
        this.url = "http://" + result;
      } else {
        this.url = result || workspaceSettings?.userDefinedUrl;
      }
    } catch (e) {
      vscode.window.showErrorMessage(
        `Loco Developer Preview could not capture your url response.` +
          defaultMessage
      );
    }
  }

  /**
   * Helper function that most importantly sets up validation behavior of url input
   * @type: {Controller}
   */
  private configureInputOptions(
    workspaceSettings?: IWorkspaceSettings
  ): vscode.InputBoxOptions {
    const config: IWorkspaceSettings = workspaceSettings
      ? workspaceSettings
      : Controller.wsSettings
      ? Controller.wsSettings
      : this.getWorkspaceConfig();

    return {
      title: "Full Http Url",
      value: config.userDefinedUrl,
      valueSelection:
        config.userDefinedUrl === DEFAULT_URL ? [17, 30] : undefined,
      validateInput: (inputStr: string) => {
        if (
          inputStr.startsWith("http://localhost") ||
          inputStr.startsWith("http://127.1.1.0") ||
          inputStr.startsWith("localhost") ||
          inputStr.startsWith("127.1.1.0")
        ) {
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
  }

  public async showPreviewPanel(attemptFastRefresh?: boolean): Promise<void> {
    if (!this.url) {
      vscode.window.showErrorMessage(
        "LDP: Server URL is undefined. Cancelling request."
      );
      return;
    }
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
                <script>
                function hideLoadingMessage(){
                  window.document.getElementById("loadingMessage").style.display="none"
                }
                </script>
            </head>
            <body>
            <h1 id="loadingMessage">Your preview is loading...</h1>
            <iframe id="preview-window" src="${this.url}" onload="hideLoadingMessage()"> Bad link given to vscode iframe.
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
  public dispose(): void {
    if (this.currentPanel) {
      this.currentPanel.dispose();
    }
    Controller._instance = undefined;
  }
}
