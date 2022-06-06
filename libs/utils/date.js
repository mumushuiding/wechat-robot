export function getNow() {
  let now = new Date();
  const salt = 8;
  now = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + salt, now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return now;
}
export function getTomorrow(date) {
  let now = date || new Date();
  const salt = 8;
  now = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, salt, 0, 0, 0);
  return now;
}
export function getDateFromVal(datestr) {
  let now = new Date(datestr);
  const salt = 8;
  now = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + salt, now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return now;
}
export function isMonday(date) {
  const now = date || getNow();
  if (now.getDay() - 1 !== 0) {
    return false;
  }
  return true;
}
export function isFirstDayOfMonth(date) {
  const now = date || getNow();
  if (now.getDate() !== 1) {
    return false;
  }
  return true;
}
