const x = '(已付款)张 三 ';
// const y = '业余2.0级-来电-冰冰冰冰';
// const arr = [ y ];
// const a = y.match(/^(.{1,8})?(级)?[-, ,_,－,—,—,～,~,/].{2,4}[-, ,_,－,—,—,～,~,/](.{1,8})/i);
// if (a) arr.push(a[a.length - 1]);
// const hasAttend = arr.some(n => x.includes(n));
// console.log(`接龙中没看到 ${arr.join('、')} ,你似乎没报名`);
// console.log(hasAttend);
// 匹配组织的人
const now = new Date();
console.log(now);
console.log(now.toISOString());
// const a = x.match(/(?<=\n1[ ,.,、]{1,5})(.*?)(?=\n2[., ,、]{1})/i);
// console.log(a);

// 匹配活动及发起人
// const regexp = /^(.*?)(?=1[、, ,]{1,5})/;

// const a = x.match(/^([\s\S]*?)\n1[ ,.,:,：,、]{1,5}/g);
// console.log(a);
// 统计最近的发言次数


// const regExp = /^([\s\S]*?)1[、, ,]{1,5}/;
// const res = regExp.exec(x);
// console.log(res);
// if (/<sourcedisplayname>分级接龙工具<\/sourcedisplayname>/i.test(x)) {
//   console.log('转发了分级接龙小程序');
// }
// if (/^业余[0-9]-.+-.+$/g.test(x)) {
//   const a = x.match(/^"(.+)"邀请/i);
//   let invitor = ''; // 邀请人
//   if (a && a.length === 2) {
//     invitor = a[1];
//   }
//   let invitee = ''; // 受邀人
//   const b = x.match(/邀请"(.+)"加入了群聊$/i);
//   if (b && b.length === 2) {
//     invitee = b[1];
//   }
//   console.log(`邀请人:${invitor},受邀人:${invitee}`);
// }
// if (/^(业余)?[0-7](\.[0-9]{1,9})?(级)?[-, ,_,－,—][\u4e00-\u9fa5]{2,4}[-, ,_,－,—][\u4e00-\u9fa5]{1,4}/g.test(x)) {
//   console.log('名字符合标准');
// }
// if (/日期|([1-9]{1,2}月[1-9]{1,2}日)|(([0-9]{1})?[0-9]{1}[.,/,-]{1}([0-9]{1})?[0-9]{1})/g.test(x) && /时间|(([0-9]{1})?[0-9]{1}[:,：]{1}[0-9]{2}[-, ,_,－,—,～]{1,4}([0-9]{1})?[0-9]{1}[:,：]{1}[0-9]{2})/g.test(x) && /场地|地点|球馆|号场/g.test(x)) {
//   console.log('匹配到接龙 ');
// }
// if (/(([0-9]{1})?[0-9]{1}[ ,.,/,-]{1,4}([0-9]{1})?[0-9]{1})/g.test(x)) {
//   console.log('匹配到日期');
// }
// if (/时间|(([0-9]{1})?[0-9]{1}[:,：]{1}[0-9]{2}[-, ,_,－,—,～]{1,4}([0-9]{1})?[0-9]{1}[:,：]{1}[0-9]{2})/g.test(x)) {
//   console.log('匹配到时间');
// }
// if (/场地|地点|球馆|号场/g.test(x)) {
//   console.log('匹配到场地和时间');
// }

