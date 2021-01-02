// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "tl-generator" is now active!');

	// The command has been defined in the package.json file
	// // Now provide the implementation of the command with registerCommand
	// // The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('tl-generator.extract-timeline', () => {
		// The code you place here will be executed every time your command is executed
		let editor = vscode.window.activeTextEditor; // エディタ取得
		if (editor){
			let doc = editor.document;
			
			let startPos = new vscode.Position(0, 0);
			let endPos = new vscode.Position(doc.lineCount - 1, 10000);
			let all_range = new vscode.Selection(startPos, endPos);

			let text = doc.getText(all_range)
			let lines = text.split(/\r\n|\n/)
			var result = "";
			for (let line of lines){
				let m = line.match(/[01]:\d{2}\s*?$/)
				if (!m){
					result += line + "\n"
				}
			}
			editor.edit(edit => {
				edit.replace(all_range, result);
			});
			vscode.window.showInformationMessage('TLの抽出が完了しました');
		}else{
			vscode.window.showInformationMessage("テキストファイルを選択してから実行してください")
		}
	});

	let createcommand = vscode.commands.registerCommand('tl-generator.create-timeline-template', () => {
		let editor = vscode.window.activeTextEditor; // エディタ取得
		if (editor){
			let doc = editor.document;
			
			let startPos = new vscode.Position(0, 0);
			let endPos = new vscode.Position(doc.lineCount - 1, 10000);
			let all_range = new vscode.Selection(startPos, endPos);
			var result = ""
			var date = new Date(2020, 1, 1, 1, 1, 23)
			for (let i=0; i < 83; i++){
				result += "\n" + date.getMinutes() + ":" +('00' + date.getSeconds()).slice(-2) + "　"
				date.setSeconds(date.getSeconds() - 1)
			}
			editor.edit(edit => {
				edit.replace(all_range, result);
			});
		}else {
			vscode.window.showInformationMessage("テキストファイルを選択してから実行してください")
	}
	});


	let insertboss = vscode.commands.registerCommand('tl-generator.insert-boss', () => {
		let editor = vscode.window.activeTextEditor; // エディタ取得
		if (editor){
			let doc = editor.document;
			let cur_selection = editor.selection
			let startPos = new vscode.Position(cur_selection.start.line, 0)
			let endPos = new vscode.Position(cur_selection.start.line, 10000)
			let range = new vscode.Range(startPos, endPos)
			let text = doc.getText(range)
			let result = "------" + text.trim() + " ボスUB------"
			editor.edit(edit => {
				edit.replace(range, result)
			});
		}else {
			vscode.window.showInformationMessage("テキストファイルを選択してから実行してください")
	}
	});
	
	context.subscriptions.push(disposable);
	context.subscriptions.push(createcommand);
	context.subscriptions.push(insertboss);
}

// this method is called when your extension is deactivated
export function deactivate() {}
