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
// 获取接龙<pagepath>(.+)</pagepath>
export function getMiniprogramPagepath(str) {
  console.log('-------小程序内容:\n' + str);
  if (!str) return null;
  let result = str;
  const a = str.match(/<pagepath>.+<\/pagepath>/g);
  if (a && a.length > 0) result = a[0];
  return result;
}
export function isMiniprogramPagepath(str) {
  if (/<pagepath>.+<\/pagepath>/g.test(str)) return true;
  return false;
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
export function getActDesc(str) {
  if (!str) return null;
  let desc;
  const c = str.match(/^[\s\S]{0,100}(?=\n1[ ,.,:,：,、]{1,4})/g);
  if (c && c.length > 0) desc = c[0];
  return desc;
}
// getActContent 匹配活动内容
export function getActContent(str) {
  if (!str) return null;
  const date = getDate(str);
  if (!date) return null;
  let name;
  // 组织人
  const c = str.match(/\n1[ ,.,:,：,、]{1,5}[\S]{1,20}/g);
  if (c && c.length > 0) name = c[0];
  if (name) {
    return date.toString() + name.replace(/[ ,(已付款)]/g, '');
  }
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
  if (/场馆|场地|地点|球馆|号场|地址/g.test(str)) {
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
  const h = _getStartHour(str);
  if (h === -1) return null;
  const min = _getStartMin(str);
  const now = new Date();
  now.setMonth(m);
  now.setDate(d);
  now.setHours(h, min, 0);
  return now;
}
export function getEndDate(str) {
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
  const h = _getEndHour(str);
  if (h === -1) return null;
  const min = _getEndMin(str);
  const now = new Date();
  now.setMonth(m);
  now.setDate(d);
  now.setHours(h, min, 0);
  return now;
}
function _getEndMin(str) {
  const minarr = str.match(/(?<=([1-9]{1})?[0-9]{1}[:,：]{1}[0-9]{2}[-, ,_,－,—,～,~,/,到]{1,4}[0-9]{1,2}[:,：]{1})([0-9]{2})/g);
  if (!minarr) return 0;
  return parseInt(minarr[0]);
}
function _getEndHour(str) {
  const harr = str.match(/(?<=[0-9]{1,2}[:,：]{1}[0-9]{2}[-, ,_,－,—,～,~,/,到]{1,4})[0-9]{1,2}(?=[:,：]{1}[0-9]{2})|(?<=[0-9]{1,2}[-, ,_,－,—,～,~,/,到])[0-9]{1,2}(?=点)/g);
  if (!harr) return -1;
  return parseInt(harr[0]);
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
  if (!str) return true;
  if (/人已满/g.test(str)) return true;
  const limit = _getPersonLimit(str);
  console.log('-----报名人数上限：' + limit);
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
  return h > 7 && h < 24;
}
// getPersonLimit 活动的人数上限
function _getPersonLimit(str) {
  let limit = 4;
  if (!str) return limit;
  let a = str.match(/(?<=上限[^0-9]{0,4})[0-9]{1,3}|(?<=[^0-9]{0,1})([0-9]{1,3})(?=人满)/g);
  if (a && a.length > 0) limit = parseInt(a[0]);
  else {
    a = str.match(/\n[0-9]{1,2}[ ,.,:,：,、]{1,4}/g);
    limit = a.length;
  }
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
// 看起来像接龙
export function looklikeAct(str) {
  if (!str) return false;
  const a = str.match(/\n[0-9]{1,2}[ ,.,:,：,、]{1,4}/g);
  if (a && a.length > 3) return true;
  return false;
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
  const x = str.match(/^(.{1,10})?[-, ,_,－,—,—,～,~,/,,,,，].{1,10}[-, ,_,－,—,—,～,~,/,,,,，](.{1,10})/i);
  if (x) {
    return x[x.length - 1];
  }
  return str;
}
export function getEast8time() {
  const timezome = 16;
  const dif = new Date().getTimezoneOffset();
  console.log(dif);
  const east8time = new Date().getTime() + dif * 60 * 1000 + timezome * 60 * 60 * 1000;
  return new Date(east8time);
}
// " 条"通过扫描"张三"分享的二维码加入群聊
export function getNameFromShare(str) {
  if (!str) return str;
  const x = str.match(/(?<="[ ])(.+)(?="通过扫描".+"分享的二维码加入群聊)/g);
  if (x) return x[0];
  return null;
}
