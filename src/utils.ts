import * as vscode from "vscode";

/**
 * editor中に含まれるテキストデータをすべて取り出す
 * 置換用にrangeも返す
 * @param editor
 * @returns
 */
export function get_all_range_data(editor: vscode.TextEditor) {
  let doc = editor.document;
  let startPos = new vscode.Position(0, 0);
  let endPos = new vscode.Position(doc.lineCount - 1, 10000);
  let all_range = new vscode.Selection(startPos, endPos);
  return { all_range: all_range, text: doc.getText(all_range) };
}
