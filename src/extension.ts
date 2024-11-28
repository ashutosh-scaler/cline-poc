// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import delay from "delay"
import * as vscode from "vscode"
import { ClineProvider } from "./core/webview/ClineProvider"
import { createClineAPI } from "./exports"
import "./utils/path" // necessary to have access to String.prototype.toPosix
import { DIFF_VIEW_URI_SCHEME } from "./integrations/editor/DiffViewProvider"

/*
Built using https://github.com/microsoft/vscode-webview-ui-toolkit

Inspired by
https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/default/weather-webview
https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/frameworks/hello-world-react-cra

*/

let outputChannel: vscode.OutputChannel
let companionPanel: vscode.WebviewPanel | undefined

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel("Companion")
	context.subscriptions.push(outputChannel)

	outputChannel.appendLine("Companion extension activated")

	const sidebarProvider = new ClineProvider(context, outputChannel)

	const toggleCompanionPanel = async () => {
		// If panel exists, close it and return
		if (companionPanel) {
			companionPanel.dispose()
			companionPanel = undefined
			return
		}

		outputChannel.appendLine("Opening Companion panel")
		companionPanel = vscode.window.createWebviewPanel(
			'companion',
			'Companion',
			vscode.ViewColumn.Beside, // Todo add support for always showing in last column
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [context.extensionUri],
			}
		)

		companionPanel.iconPath = {
			light: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "robot_panel_light.png"),
			dark: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "robot_panel_dark.png"),
		}

		const tabProvider = new ClineProvider(context, outputChannel)
		tabProvider.resolveWebviewView(companionPanel)

		// Reset panel reference when closed
		companionPanel.onDidDispose(() => {
			companionPanel = undefined
		})

		// Lock the editor group so clicking on files doesn't open them over the panel
		await delay(100)
		await vscode.commands.executeCommand("workbench.action.lockEditorGroup")
	}

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand("companion.togglePanel", toggleCompanionPanel)
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("companion.settingsButtonClicked", () => {
			const provider = ClineProvider.getVisibleInstance()
			if (provider) {
				provider.postMessageToWebview({ type: "action", action: "settingsButtonClicked" })
			}
		})
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("companion.historyButtonClicked", () => {
			const provider = ClineProvider.getVisibleInstance()
			if (provider) {
				provider.postMessageToWebview({ type: "action", action: "historyButtonClicked" })
			}
		})
	)

	/*
	We use the text document content provider API to show the left side for diff view by creating a virtual document for the original content. This makes it readonly so users know to edit the right side if they want to keep their changes.

	- This API allows you to create readonly documents in VSCode from arbitrary sources, and works by claiming an uri-scheme for which your provider then returns text contents. The scheme must be provided when registering a provider and cannot change afterwards.
	- Note how the provider doesn't create uris for virtual documents - its role is to provide contents given such an uri. In return, content providers are wired into the open document logic so that providers are always considered.
	https://code.visualstudio.com/api/extension-guides/virtual-documents
	*/
	const diffContentProvider = new (class implements vscode.TextDocumentContentProvider {
		provideTextDocumentContent(uri: vscode.Uri): string {
			return Buffer.from(uri.query, "base64").toString("utf-8")
		}
	})()
	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(DIFF_VIEW_URI_SCHEME, diffContentProvider)
	)

	// URI Handler
	const handleUri = async (uri: vscode.Uri) => {
		const path = uri.path
		const query = new URLSearchParams(uri.query.replace(/\+/g, "%2B"))
		const visibleProvider = ClineProvider.getVisibleInstance()
		if (!visibleProvider) {
			return
		}
		switch (path) {
			case "/openrouter": {
				const code = query.get("code")
				if (code) {
					await visibleProvider.handleOpenRouterCallback(code)
				}
				break
			}
			default:
				break
		}
	}
	context.subscriptions.push(vscode.window.registerUriHandler({ handleUri }))

	// Automatically open the panel when extension activates
	toggleCompanionPanel()

	return createClineAPI(outputChannel, sidebarProvider)
}

// This method is called when your extension is deactivated
export function deactivate() {
	outputChannel.appendLine("Companion extension deactivated")
}
