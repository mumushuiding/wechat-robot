import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
import fs from 'fs';

export function getJsonFromFilePath(path) {
  try {
    const result = JSON.parse(fs.readFileSync(getFilePath(path), {
      encoding: 'utf-8',
    }));
    return result;
  } catch (err) {
    console.log(err);
  }
}
export function getFilePath(path) {
  return join(__dirname, path);
}
// getOrganizer 匹配出组织者
export function getOrganizer(str) {
  if (!str) return null;
  // const a = str.match(/\n1[.,:,：,、]{1}(.{3,20})\n2[.,:,：,、]{1}/i);
  str = str.replace('(已付款)', '');
  const a = str.match(/(?<=\n1[ ,.,:,：,、]{1,5})[\S]{1,20}(?=[\s]{0,10}\n2[ ,.,:,：,、]{1})/i);
  let result = null;
  if (a && a.length > 0) {
    console.log('匹配到组织者:' + a[0].trim());
    result = a[0];
  }
  return result;
}

// getActContent 匹配活动内容
export function getActContent(str) {
  if (!str) return null;
  // 活动月和日
  let datestr = '';
  let name;
  const b = str.match(/今天|上午|下午|晚上|明天|([0-9]{1,2}月[0-9]{1,2}日)/g);
  if (b && b.length > 0) datestr = b[0];
  // 组织人
  const c = str.match(/\n1[ ,.,:,：,、]{1,5}[\S]{1,20}/g);
  if (c && c.length > 0) name = c[0];
  if (name) {
    return datestr + name;
  }
  // const a = str.match(/^([\s\S]*?)\n1[ ,.,:,：,、]{1}/g);
  // if (a && a.length > 0) return a[0];
  return null;
}

// isAct 判断是否是个活动
export function isAct(str) {
  let date = false;
  let time = false;
  let place = false;
  let first = false;
  if (/日期|今天|上午|下午|晚上|明天|([0-9]{1,2}月[0-9]{1,2}日)|(([1-9]{1})?[0-9]{1}[ ,.,/,-,——]{1}([0-9]{1})?[0-9]{1})/g.test(str)) {
    date = true;
    console.log('匹配到日期');
  }
  if (/时间|([0-9]{1,2}[-, ,_,－,—,～,~,/,到][0-9]{1,2}点)|(([0-9]{1})?[0-9]{1}[:,：]{1}[0-9]{2}[-, ,_,－,—,～,~,/,到]{1,4}([0-9]{1})?[0-9]{1}[:,：]{1}[0-9]{2})/g.test(str)) {
    time = true;
    console.log('匹配到时间');
  }
  if (/场地|地点|球馆|号场|地址/g.test(str)) {
    place = true;
    console.log('匹配到场地');
  }
  // 是否匹配到第一个报名的人
  if (/\n1[ ,.,:,：,、]{1}/g.test(str)) {
    first = true;
    console.log('匹配到1个报名人');
  }
  return date && time && place && first;
}
/**
 * getDate 匹配日期和时间，日期格式：4月21日，时间格式：8:00-12:00
 * @param {*} str
 */
export function getDate(str) {
  if (!str) return null;
  const a = str.match(/[0-9]{1,2}月[0-9]{1,2}[日,号]/g);
  let datestr = null;
  if (a && a.length > 0) datestr = a[0];
  if (!datestr) return datestr;
  const marr = datestr.match(/(([1-9]{1})?[0-9]{1})(?=月)/g);
  if (!marr) return null;
  const m = parseInt(marr[0]) - 1;
  const darr = datestr.match(/(?<=月)([0-9]{1,2})(?=[日,号])/g);
  if (!darr) return null;
  const d = parseInt(darr[0]);

  // const harr = str.match(/[0-9]{1,2}(?=[:,：]{1}[0-9]{2}[-, ,_,－,—,～,~,/,到]{1,4}[0-9]{1,2}[:,：]{1}[0-9]{2})/g);
  // if (!harr) return null;
  // const h = parseInt(harr[0]);

  const h = _getStartHour(str);
  if (h === -1) return null;

  // const minarr = str.match(/(?<=([1-9]{1})?[0-9]{1}[:,：]{1})([0-9]{2})(?=[-, ,_,－,—,～,~,/,到]{1,4}[0-9]{1,2}[:,：]{1}[0-9]{2})/g);
  // if (!minarr) return null;
  // const min = parseInt(minarr[0]);

  const min = _getStartMin(str);
  const now = new Date();
  console.log(`m:${m},d:${d},h:${h},min:${min}`);
  now.setMonth(m);
  now.setDate(d);
  now.setHours(h, min, 0);
  return now;
}
function _getStartMin(str) {
  const minarr = str.match(/(?<=([1-9]{1})?[0-9]{1}[:,：]{1})([0-9]{2})(?=[-, ,_,－,—,～,~,/,到]{1,4}[0-9]{1,2}[:,：]{1}[0-9]{2})/g);
  if (!minarr) return 0;
  return parseInt(minarr[0]);
}
function _getStartHour(str) {
  const harr = str.match(/([0-9]{1,2}(?=[:,：]{1}[0-9]{2}[-, ,_,－,—,～,~,/,到]{1,4}[0-9]{1,2}[:,：]{1}[0-9]{2}))|([0-9]{1,2}(?=[-, ,_,－,—,～,~,/,到][0-9]{1,2}点))/g);
  if (!harr) return -1;
  return parseInt(harr[0]);
}
/**
 * hasActFull 是否已经报满
 * @param {*} str 活动内容
 */
export function hasActFull(str) {
  const limit = _getPersonLimit(str);
  const attend = _getAttendNumber(str);
  const f = attend >= limit;
  // console.log(`上限：${limit}，已报名：${attend}，是否满：${f}`);
  return f;
}
/**
 * isDayTime 8点~20点
 */
export function isDayTime() {
  const now = new Date();
  const h = now.getHours();
  return h > 8 && h < 22;
}
// getPersonLimit 活动的人数上限
function _getPersonLimit(str) {
  let limit = 4;
  if (!str) return limit;
  const a = str.match(/(?<=上限[^0-9]{0,4})[0-9]{1,3}|(?<=[^0-9]{0,1})([0-9]{1,3})(?=人满)/g);
  if (a && a.length > 0) limit = parseInt(a[0]);
  return limit;
}
// _getAttendNumber 活动目前已报名人数
function _getAttendNumber(str) {
  let x = 10000;
  if (!str) return x;
  const a = str.match(/(?<=\n)[0-9]{1,2}(?=[ ,.,:,：,、]{1,4}[\S]{1,15})/g);
  if (a && a.length > 0) {
    x = a.length;
  }
  return x;
}
// getAttendPerson 获取参与人员列表
export function getAttendPerson(str) {
  if (!str) return [];
  const a = str.match(/(?<=\n[0-9]{1,2}[ ,.,:,：,、]{1,4})[\S]{1,20}/g);
  if (a && a.length > 0) return a;
  return [];
}
// getShortName 访问名字缩写，如：业余3-台江-张三 则返回张三
export function getShortName(str) {
  if (!str) return str;
  const x = str.match(/^(.{1,8})?[-, ,_,－,—,—,～,~,/,,,,，].{2,4}[-, ,_,－,—,—,～,~,/,,,,，](.{1,8})/i);
  if (x) {
    return x[x.length - 1];
  }
  return str;
}
