
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
      console.log(damage_match);
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
