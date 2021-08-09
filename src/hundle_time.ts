export function seconds_to_str(second: number) {
  return (
    (second < 0 ? "-" : "") +
    Math.floor(Math.abs(second / 60)) +
    ":" +
    ("00" + (Math.abs(second) % 60)).slice(-2)
  );
}

export function get_new_seconds(old_time: string, diff: number) {
  return (
    new Date(
      2020,
      1,
      1,
      1,
      Number(old_time.split(":")[0]),
      Number(old_time.split(":")[1])
    ).getTime() /
      1000 -
    new Date(2020, 1, 1, 1, 0, -diff).getTime() / 1000
  );
}
