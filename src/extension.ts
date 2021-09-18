// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

import * as utils from "./utils";
import { TextEncoder } from "util";
import { get_new_seconds, seconds_to_str } from "./hundle_time";
import { convert_battle_tl, overwrite_battle_tl } from "./battle_tl";

function calculate_time_command(diff: number, head: Boolean = true) {
  let editor = vscode.window.activeTextEditor;
  if (editor) {
    let doc = editor.document;
    let cur_selection = editor.selection;
    let startPos = new vscode.Position(cur_selection.start.line, 0);
    let endPos = new vscode.Position(cur_selection.start.line, 1000);
    let range = new vscode.Range(startPos, endPos);
    let text = doc.getText(range);
    let m = text.match(/0?[01]:\d{2}/);
    if (m) {
      let last_index = head ? 1 : m.length;
      for (let i = 0; i < last_index; i++) {
        let new_time = seconds_to_str(get_new_seconds(m[0], diff));
        let new_text = text.replace(m[0], new_time);
        editor.edit((edit) => {
          edit.replace(range, new_text);
        });
      }
    }
  }
}

function create_carry_over_tl(original_tl: string, carry_over_time: number) {
  let lines = original_tl.split(/\r\n|\n/);
  var time_over_flag = false;
  var result = "";
  let diff = carry_over_time - 90;
  for (let line of lines) {
    let matchs = line.match(/0?[01]:\d{2}/);
    if (matchs) {
      var new_seconds = get_new_seconds(matchs[0], diff);
      if (new_seconds <= 0 && !time_over_flag) {
        result += "\n===== TIME UP =====\n\n";
        time_over_flag = true;
      }
      if (new_seconds < -10) {
        break;
      }
      matchs.forEach((m) => {
        line = line.replace(m, seconds_to_str(get_new_seconds(m, diff)));
      });
    }
    result += line + "\n";
  }
  return result;
}

async function create_carry_over_tl_file() {
  let editor = vscode.window.activeTextEditor; // エディタ取得
  if (!editor) {
    vscode.window.showErrorMessage("テキストファイルを選択してから実行してください");
    return;
  }

  let carry_over_time_str = await vscode.window.showInputBox({
    prompt: "持ち越し秒数を入力してください(半角数字)",
  });
  if (!carry_over_time_str) {
    vscode.window.showErrorMessage("持ち越しTL作成を中止します");
    return;
  }

  let all_range_data = utils.get_all_range_data(editor);
  let new_tl = create_carry_over_tl(all_range_data.text, Number(carry_over_time_str));
  let name = editor.document.fileName.split("/").pop();
  if (name) {
    let new_name = name.split(".")[0] + "_持ち越し" + carry_over_time_str + "秒.tl";
    let new_file_uri = vscode.Uri.joinPath(editor.document.uri, "..", new_name);
    vscode.window.showInformationMessage(
      "editor.document.uri: " + editor.document.uri + "\nnew_file_uri: " + new_file_uri
    );
    vscode.workspace.fs.writeFile(new_file_uri, new TextEncoder().encode(new_tl)).then((_) => {
      vscode.commands.executeCommand("vscode.open", new_file_uri);
    });
  } else {
    vscode.window.showErrorMessage("エラーが発生しました");
  }
}

async function get_char_infos() {
  let prompt_list = [
    "キャラ名を入力してください",
    "の星を入力してください (半角数字)",
    "のランクを入力してください (半角数字)",
    "の専用レベルを入力してください (半角数字、未装備の場合は未記入でEnter)",
    "についてその他特記するべき内容があれば入力してください",
  ];
  var result: string[][] = [];
  for (let i = 0; i < 5; i++) {
    var char = "";
    let value = await vscode.window.showInputBox({
      prompt: prompt_list[0] + "(" + String(i + 1) + ")",
    });
    if (value) {
      char = value;
    }
    var char_infos: string[] = [char];
    for (let j = 1; j < 5; j++) {
      let value = await vscode.window.showInputBox({
        prompt: char + prompt_list[j],
      });
      if (value) {
        char_infos.push(value);
      } else {
        char_infos.push("");
      }
    }
    result.push(char_infos);
  }
  return result;
}

function get_char_names_list_from_tl(timeline: string) {
  let lines = timeline.split(/\r\n|\n/);
  var char_list: string[] = [];
  for (let line of lines) {
    let m = line.match(/^\S+\s+星\d\s*R\d/);
    if (m) {
      char_list.push(line.split(/\s/)[0]);
      if (char_list.length === 5) {
        return char_list;
      }
    }
  }
  return char_list;
}

function insert_char_name(char_number: number) {
  let editor = vscode.window.activeTextEditor; // エディタ取得
  if (editor) {
    let cur_selection = editor.selection;
    let all_range_data = utils.get_all_range_data(editor);

    let char_list = get_char_names_list_from_tl(all_range_data.text);
    editor.edit((edit) => {
      edit.insert(cur_selection.active, char_list[char_number - 1]);
    });
  } else {
    vscode.window.showErrorMessage("テキストファイルを選択してから実行してください");
  }
}

export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "tl-generator" is now active!');

  // The command has been defined in the package.json file
  // // Now provide the implementation of the command with registerCommand
  // // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("tl-generator.extract-timeline", () => {
    // The code you place here will be executed every time your command is executed
    let editor = vscode.window.activeTextEditor; // エディタ取得
    if (editor) {
      let all_range_data = utils.get_all_range_data(editor);
      let lines = all_range_data.text.split(/\r\n|\n/);
      var result = "";
      for (let line of lines) {
        let m = line.match(/[01]:\d{2}\s*?$/);
        if (!m) {
          result += line + "\n";
        }
      }
      editor.edit((edit) => {
        edit.replace(all_range_data.all_range, result);
      });
      vscode.window.showInformationMessage("TLの抽出が完了しました");
    } else {
      vscode.window.showErrorMessage("テキストファイルを選択してから実行してください");
    }
  });

  let createcommand = vscode.commands.registerCommand(
    "tl-generator.create-timeline-template",
    async () => {
      let editor = vscode.window.activeTextEditor; // エディタ取得
      if (editor) {
        let char_infos = await get_char_infos();
        var result = "";
        var max_char_length = 0;
        var max_equip_length = 0;
        for (let char_info of char_infos) {
          if (char_info[0].length > max_char_length) {
            max_char_length = char_info[0].length;
          }
          if (char_info[3].length > max_equip_length) {
            max_equip_length = char_info[3].length;
          }
        }

        for (let char_info of char_infos) {
          result +=
            char_info[0] +
            "　".repeat(max_char_length - char_info[0].length + 1) +
            "星" +
            char_info[1] +
            "R" +
            char_info[2];
          if (char_info[3]) {
            result += "専用" + char_info[3] + " ".repeat(max_equip_length - char_info[3].length);
          } else {
            result += "　　" + " ".repeat(max_equip_length);
          }
          result += "　" + char_info[4] + "\n";
        }

        let all_range_data = utils.get_all_range_data(editor);

        var date = new Date(2020, 1, 1, 1, 1, 23);
        for (let i = 0; i < 83; i++) {
          result += "\n" + date.getMinutes() + ":" + ("00" + date.getSeconds()).slice(-2) + "　";
          date.setSeconds(date.getSeconds() - 1);
        }
        editor.edit((edit) => {
          edit.replace(all_range_data.all_range, result);
        });
      } else {
        vscode.window.showErrorMessage("テキストファイルを選択してから実行してください");
      }
    }
  );

  let insertboss = vscode.commands.registerCommand("tl-generator.insert-boss", () => {
    let editor = vscode.window.activeTextEditor; // エディタ取得
    if (editor) {
      let doc = editor.document;
      let cur_selection = editor.selection;
      let startPos = new vscode.Position(cur_selection.start.line, 0);
      let endPos = new vscode.Position(cur_selection.start.line, 10000);
      let range = new vscode.Range(startPos, endPos);
      let text = doc.getText(range);
      let result = "------ " + text.trim() + " ボスUB ------";
      editor.edit((edit) => {
        edit.replace(range, result);
      });
    } else {
      vscode.window.showErrorMessage("テキストファイルを選択してから実行してください");
    }
  });

  let insertstop = vscode.commands.registerCommand("tl-generator.insert-stop-point", () => {
    let editor = vscode.window.activeTextEditor; // エディタ取得
    if (editor) {
      let cur_selection = editor.selection;
      let pos = new vscode.Position(cur_selection.start.line, 0);
      let result = "！！！！！！！！ここで止めるッ！！！！！！！！\n";
      editor.edit((edit) => {
        edit.insert(pos, result);
      });
    } else {
      vscode.window.showErrorMessage("テキストファイルを選択してから実行してください");
    }
  });

  let convert_battle_tl_command = vscode.commands.registerCommand(
    "tl-generator.convert_battle_tl",
    () => {
      let editor = vscode.window.activeTextEditor;
      if (editor) {
        let all_range_data = utils.get_all_range_data(editor);
        editor.edit((edit) => {
          edit.replace(all_range_data.all_range, convert_battle_tl(all_range_data.text));
        });
      } else {
        vscode.window.showErrorMessage("テキストファイルを選択してから実行してください");
      }
    }
  );

  let overwrite_tl_command = vscode.commands.registerCommand(
    "tl-generator.overwrite_battle_tl",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        let all_range_data = utils.get_all_range_data(editor);
        vscode.env.clipboard.readText().then((text) => {
          var battle_tl = convert_battle_tl(text);
          editor.edit((edit) => {
            edit.replace(
              all_range_data.all_range,
              overwrite_battle_tl(all_range_data.text, battle_tl)
            );
          });
        });
      } else {
        vscode.window.showErrorMessage("テキストファイルを選択してから実行してください");
      }
    }
  );
  // TLの秒数を調整するコマンド
  let add_time = vscode.commands.registerCommand("tl-generator.add-time", () => {
    calculate_time_command(1);
  });

  let subtract_time = vscode.commands.registerCommand("tl-generator.subtract-time", () => {
    calculate_time_command(-1);
  });

  let insert_char1 = vscode.commands.registerCommand("tl-generator.insert-char1", () => {
    insert_char_name(1);
  });
  let insert_char2 = vscode.commands.registerCommand("tl-generator.insert-char2", () => {
    insert_char_name(2);
  });
  let insert_char3 = vscode.commands.registerCommand("tl-generator.insert-char3", () => {
    insert_char_name(3);
  });
  let insert_char4 = vscode.commands.registerCommand("tl-generator.insert-char4", () => {
    insert_char_name(4);
  });
  let insert_char5 = vscode.commands.registerCommand("tl-generator.insert-char5", () => {
    insert_char_name(5);
  });
  let co_tl_command = vscode.commands.registerCommand("tl-generator.carry-over-tl", async () => {
    await create_carry_over_tl_file();
  });
  context.subscriptions.push(disposable);
  context.subscriptions.push(createcommand);
  context.subscriptions.push(insertboss);
  context.subscriptions.push(insertstop);
  context.subscriptions.push(add_time);
  context.subscriptions.push(subtract_time);
  context.subscriptions.push(insert_char1);
  context.subscriptions.push(insert_char2);
  context.subscriptions.push(insert_char3);
  context.subscriptions.push(insert_char4);
  context.subscriptions.push(insert_char5);
  context.subscriptions.push(co_tl_command);
  context.subscriptions.push(convert_battle_tl_command);
  context.subscriptions.push(overwrite_tl_command);
}

// this method is called when your extension is deactivated
export function deactivate() {}
