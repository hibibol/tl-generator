import * as vscode from "vscode";
import { is_boss, translate_to_nick } from "./char";
import { get_new_seconds } from "./hundle_time";

interface LineData {
  index: number;
  time: string;
  char: string;
  info?: string;
}

/**
 * 同じ行 (秒数とキャラ名が同じ)が存在するかどうかを判定する
 * @param line_data
 * @param tl_data
 * @returns
 */
function has_same_line(line_data: LineData, tl_data: LineData[]) {
  return tl_data.some((tl_line_data) => {
    return is_same_line_data(tl_line_data, line_data);
  });
}

function get_line_data_by_index(index: number, tl_data: LineData[]) {
  for (let line_data of tl_data) {
    if (line_data.index === index) {
      return line_data;
    }
  }
}

function is_same_line_data(line_data1: LineData, line_data2: LineData) {
  return (
    line_data1.time === line_data2.time && line_data1.char === line_data2.char
  );
}

function line_data_to_string(line_data: LineData, former_time: string) {
  let result = "";
  if (line_data.char === "ボスUB") {
    result += "------ " + line_data.time + " ボスUB ------";
  } else if (line_data.time === former_time) {
    result += "    " + line_data.char;
  } else {
    result += line_data.time + "　" + line_data.char;
  }
  result += line_data.info ? "　" + line_data.info : "";
  return result;
}

function extract_tl_data(tl_lines: string[]) {
  let result: LineData[] = [];
  let now = "";
  tl_lines.forEach((line, index) => {
    let time_match = line.match(/^([01]:\d{2})\s+(?<char>\S+)\s?(?<info>.+)?/);
    let same_time_match = line.match(/^\s+(?<char>\S+)\s?(?<info>.+)?/);
    let boss_match = line.match(
      /^------\s?([01]:\d{2})\s?ボスUB\s?------\s?(?<info>.+)?/
    );
    if (time_match) {
      // なんか冗長だけど
      if (time_match.groups) {
        result.push({
          index: index,
          time: time_match[1],
          char: translate_to_nick(time_match.groups.char),
          info: time_match.groups.info,
        });
        now = time_match[1];
      }
    } else if (same_time_match) {
      if (same_time_match.groups) {
        result.push({
          index: index,
          time: now,
          char: translate_to_nick(same_time_match.groups.char),
          info: same_time_match.groups.info,
        });
      }
    } else if (boss_match) {
      if (boss_match.groups) {
        result.push({
          index: index,
          time: boss_match[1],
          char: "ボスUB",
          info: boss_match.groups.info,
        });
      }
      now = boss_match[1];
    }
  });
  return result;
}

export function overwrite_battle_tl(old_tl: string, new_tl: string) {
  let old_tl_lines = old_tl.split(/\r\n|\n/);
  let new_tl_lines = new_tl.split(/\r\n|\n/);
  let old_tl_data = extract_tl_data(old_tl_lines);
  let new_tl_data = extract_tl_data(new_tl_lines);

  if (new_tl_data.length === 0) {
    vscode.window.showInformationMessage(
      "上書きするバトルTLがありませんでした。"
    );
    return old_tl;
  }

  let result = "";
  let delete_tl_data = old_tl_data.filter((line_data) => {
    return !has_same_line(line_data, new_tl_data);
  });
  let new_tl_index = 0;
  let now = "";
  let written_line_data: LineData[] = [];
  for (let i = 0; i < old_tl_lines.length; i++) {
    let line_data = get_line_data_by_index(i, old_tl_data);
    // TLと関係ないところはそのままにする
    if (!line_data) {
      result += old_tl_lines[i] + "\n";
    } else {
      // 旧TLのうち新TLに存在しないもの
      if (get_line_data_by_index(i, delete_tl_data)) {
        continue;
      } else {
        // 新TLにだけあるデータがないかをチェックする
        let new_tl_line_data = new_tl_data[new_tl_index];

        while (
          new_tl_index < new_tl_data.length &&
          !is_same_line_data(new_tl_line_data, line_data)
        ) {
          result += line_data_to_string(new_tl_line_data, now) + "\n";
          now = new_tl_line_data.time;
          new_tl_index++;
          new_tl_line_data = new_tl_data[new_tl_index];
          written_line_data.push(new_tl_line_data);
        }
        // 同じ秒数で既に記載がされていない場合はこれを追記する
        if (
          new_tl_data.filter((new_tl_line_data) => {
            if (!line_data) {
              return false;
            }
            return is_same_line_data(new_tl_line_data, line_data);
          }).length >
          written_line_data.filter((w_line_data) => {
            if (!line_data) {
              return false;
            }
            return is_same_line_data(w_line_data, line_data);
          }).length
        ) {
          result += line_data_to_string(line_data, now) + "\n";
          now = line_data.time;
          new_tl_index++;
          written_line_data.push(line_data);
        }
      }
    }
  }
  // 古いTLが存在しない場合には直接書き込む
  if (old_tl_data.length === 0) {
    result += new_tl;
  }
  return result;
}

export /**
 * プリコネからコピペしたバトルTLを見やすいように変換する
 * @param battle_tl プリコネからコピペしたバトルTL
 */
function convert_battle_tl(battle_tl: string) {
  let result = "";
  let tl = "";
  let now_time = "";
  let max_char_length = 0;
  let char_infos: string[][] = [];
  for (let line of battle_tl.split(/\r\n|\n/)) {
    let time_matchs = line.match(/^0[01]:\d{2}/);
    let char_info_match = line.match(
      /^(\S{1,}) ★(\d) Lv(\d{1,}) RANK(\d{2,})$/
    );
    let damage_match = line.match(/^(\d{1,})ダメージ$/);

    if (time_matchs) {
      let char_name = line.split(" ")[1];
      if (char_name === "バトル開始") {
        continue;
      }
      if (is_boss(char_name)) {
        tl += "------ " + time_matchs[0].slice(1) + " ボスUB ------\n";
      } else if (char_name === "バトル終了") {
        if (time_matchs[0] !== "00:00") {
          tl += time_matchs[0].slice(1) + " 討伐";
          result += " " + get_new_seconds(time_matchs[0], 0) + "s討伐";
        }
      } else {
        if (now_time === time_matchs[0].slice(1)) {
          tl += "    ";
        } else {
          tl += time_matchs[0].slice(1) + "　";
        }
        tl += translate_to_nick(char_name) + "\n";
      }
      now_time = time_matchs[0].slice(1);
    } else if (char_info_match) {
      let char_name = translate_to_nick(char_info_match[1]);
      max_char_length =
        char_name.length > max_char_length ? char_name.length : max_char_length;
      char_infos.push([char_name, char_info_match[2], char_info_match[4]]);
    } else if (damage_match) {
      result += damage_match[1].slice(0, -4) + "万";
    }
  }

  let char_info_text = "";
  char_infos.forEach((char_info) => {
    char_info_text +=
      char_info[0] +
      "　".repeat(max_char_length - char_info[0].length + 1) +
      "星" +
      char_info[1] +
      "　R" +
      char_info[2] +
      "\n";
  });
  result += "\n\n" + char_info_text + "\n\n" + tl;
  return result;
}
