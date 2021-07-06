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
  private static currentPanel: vscode.WebviewPanel | undefined = undefined;
  private url: string | undefined;

  private constructor(context: vscode.ExtensionContext) {
    Controller.vsContext = context;
    Controller.wsSettings = this.getWorkspaceConfig();
    this;
  }
  /**
   * Making public to give control refreshing user workspace settings, function args are optional for this reason.
   * @type: {Controller}
   */
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
    const value = this.url || config.userDefinedUrl;
    // search for colon after app protocol indicating port number
    const portStartIndex = value?.indexOf(":", 6) || -1;
    const valueSelection: [number, number] | undefined =
      portStartIndex !== -1 && value
        ? [portStartIndex + 1, value.length]
        : undefined;
    return {
      title: "Full Http Url",
      value,
      valueSelection,
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
        "LDP: Server URL input is undefined. Cancelling request."
      );
      return;
    }
    if (Controller.currentPanel) {
      Controller.currentPanel.reveal(vscode.ViewColumn.Two);
      if (attemptFastRefresh) {
        Controller.currentPanel.webview.postMessage({
          command: "setUrl",
          url: this.url,
        });
      }
    }

    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    //   vscode.window.showInformationMessage(
    //   );
    else {
      Controller.currentPanel = vscode.window.createWebviewPanel(
        "responsivepreview", // Identifies the type of the webview. Used internally
        "LDP", // Title of the panel displayed to the user
        vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
        { enableScripts: true, retainContextWhenHidden: true } // Webview options. Retain context.
      );
      Controller.currentPanel.webview.html = `<!DOCTYPE html>
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
                   h1 {
                     text-align:center;
                   }
                </style>
                <script>
                const vscode = acquireVsCodeApi();
                vscode.postMessage({command:"ready"})

                function hideLoadingMessage(){
                  window.document.getElementById("loadingMessage").style.display="none";
                }
                function verifyUrl(url){
                  fetch(url, {mode:"no-cors"}).catch(reportError);
                }
                
                function reportError(e){
                  console.error("Error:", e);
                  vscode.postMessage({command:"alert", error:true})
                }
                
                // Handle the message inside the webview
                window.addEventListener('message', event => {
                  const message = event.data; // The JSON data our extension sent
                  
                  switch (message.command) {
                    case 'setUrl':
                      verifyUrl(message.url);
                      window.document.getElementById("loadingMessage").style.display="block";
                      window.document.getElementById("loadingMessage").innerHTML="Your preview is loading: " + message.url;
                      const iframe = window.document.getElementById('preview-window');
                      iframe.src = message.url
                      break;
                  }
                });
                </script>
            </head>
            <body>
            <h1 id="loadingMessage">Your preview is loading...</h1>
            <iframe id="preview-window" onload="hideLoadingMessage()" onerror="reportError()"> Bad link given to vscode iframe.
            </iframe>
            </body>
            </html>`;

      // Handle messages from the webview
      Controller.currentPanel.webview.onDidReceiveMessage(
        (message) => {
          const TRYAGAIN = "Try Another URL";
          const CLOSE = "Close Alert";
          switch (message.command) {
            case "alert":
              vscode.window
                .showErrorMessage(
                  "LDP is detecting the url is not working... False positives may be from CORS policy, so ignore this message if page is working.",
                  TRYAGAIN,
                  CLOSE
                )
                .then((selection) => {
                  if (selection === TRYAGAIN) {
                    this.setServerUrlAndShowRefreshPage(undefined, true);
                  } else if (selection === CLOSE) {
                    // Allow vscode error window to close with no action
                    // Controller.currentPanel!.dispose();
                  }
                });
              return;
            case "ready":
              Controller.currentPanel!.webview.postMessage({
                command: "setUrl",
                url: this.url,
              });
          }
        },
        undefined,
        Controller.vsContext.subscriptions
      );
      Controller.currentPanel.onDidDispose(
        () => {
          this.dispose();
        },
        undefined,
        Controller.vsContext.subscriptions
      );
    }
  }
  public dispose(): void {
    if (Controller.currentPanel) {
      Controller.currentPanel.dispose();
      Controller.currentPanel = undefined;
    }
    Controller._instance = undefined;
  }
}
