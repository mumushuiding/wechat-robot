import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { saveAct, hasActFinish } from '../libs/activity.js';
import { isDayTime, hasActFull, isAct, getOrganizer, getShortName } from '../libs/utils.js';
import { startPayRequire, sbTransfer, sbPayed } from '../libs/pay.js';
import { LowSync, JSONFileSync } from 'lowdb';
import lodash from 'lodash';


const __dirname = dirname(fileURLToPath(import.meta.url));

// Use JSON file for storage
const file = join(__dirname, './db.json');
const adapter = new JSONFileSync(file);
const db = new LowSync(adapter);

db.read();
db.chain = lodash.chain(db.data);
// // talkInc({ wxid: 'wxid_zqptk9a2wmwo21', wxname: 'abc', room: '测试群', db });
// talkInc({ wxid: 'wxid_zqptk9a2wmwo21', wxname: 'abc', room: '测试群', db });
// const res = talkRank({ db, topic: '测试群', collection: 'divers', limit: 10, isAsc: false });
// console.log(res);
// if (/^#接龙/g.test('#接龙aagggg')) {
//   console.log('包含 #接龙');
// }
// console.log(findWxidFromDB({ wxname: '业余3-闽侯-小温', collection: 'divers', roomname: '福州羽毛球健身群', db }));
// const ids = findWxidFromDB({ wxname: '业余3-闽侯-小温', collection: 'divers', roomname: '福州羽毛球健身群', db });
// console.log(findAliasIllegal({ collection: 'divers', roomname: '福州羽毛球健身群', db }));
// const a = `4月22日     星期日   晚上
// 球馆：福州群众路市体育馆
// 场地:   三、六、七、号场
// 时间：03:00~22:30（3.5小时）
// 上限：6
// 1、咖啡
// 2、710`;
const y = `日期：5月8日  周六下午  金山繁星
15场  16:00-18:00    真丶菜鸡双打（混双，男双均可，欢迎大腿带菜鸡^_^）。8人满
当日12点前退坑不收咕咕费
费用AA，球：亚狮龙A9，7元一粒

1. 林汀
2. 罗伯特
3.橙子
4. 
5. 
6.
#我要收款0.2`;

const x = [ y ];
const room = '测试群';
let a = [ 1, 2, 3 ];
console.log(a.slice(0, 2));
a = a.slice(0, 2);
console.log(a);
console.log(startPayRequire({ db, act: y, roomname: room }));
// console.log('(已付款) 罗伯特'.replace('(已付款)', '').replace(/(^\s*)|(\s*$)/g, ''));
// console.log(sbTransfer({ db, wxid: 'wxid_zqptk9a2wmwo21', wxname: '罗伯特', roomname: room }));
// console.log(sbPayed({ db, transferid: 'wxid_7iamaquxeufz22', receiverid: 'wxid_zqptk9a2wmwo21', title: '4月30日\n1. 林汀', roomname: room }));
// console.log(getOrganizer(y));
// console.log(hasActFinish(y));
// console.log(hasActFull(y));
// console.log(getShortName('业余2.5-台江，蟹老板'));
// console.log(isDayTime());
// console.log(isAct(y));
// let i = 0;
// x.forEach(a => {
//  i++;
//  console.log(`${i},是否满：${hasActFull(a)}，是否过期：${hasActFinish(a)},是否需要通知:${!hasActFull(a) && !hasActFinish(a)}`);
// });
// saveAct({ room, db, actinfo: y });
// console.log(hasActFinish(a));
// function findAliasIllegal({ collection, roomname, db }) {
//   const room = db.chain.get(collection).find({ room: roomname }).value();
//   if (!room || !room.talks) return [];
//   const cs = lodash.chain(room.talks).filter(function(v) {
//     return !/^(业余)?[0-9](\.[0-9]{1})?(级)?-[\u4e00-\u9fa5]{2,4}-[\u4e00-\u9fa5]{1,4}/g.test(v.wxname);
//   }).take(10)
//     .value();
//   if (cs && cs.length > 0) {
//     return cs.map(c => c.wxname);
//   }
//   return [];
// }
// function findWxidFromDB({ wxname, collection, roomname, db }) {
//   const room = db.chain.get(collection).find({ room: roomname }).value();
//   if (!room || !room.talks) return [];
//   const cs = lodash.chain(room.talks).filter(function(v) {
//     return v.wxname === wxname;
//   }).take()
//     .value();
//   if (cs && cs.length > 0) {
//     return cs.map(c => c.wxid);
//   }
//   return [];
// }
// // const text = res.map(v => `成员：${v.wxname}, 发言:${v.talk},组织:${v.create},参与:${v.attend},活跃度:${v.active}`).join('\n\n');
// // console.log(text);
// /**
//  *
//  * @param {*} param0
//  */
// function talkRank({ db, topic, collection, limit, isAsc }) {
// //   const divers = db.data.divers || [];
// //   const room = lodash.chain(divers).find({ room: topic }).value();
//   const room = db.chain.get(collection).find({ room: topic }).value();
//   if (!room || !room.talks) return [];
//   return lodash.chain(room.talks).filter(function(v) {
//     return !v.isnew;
//   }).orderBy('active', isAsc ? 'asc' : 'desc')
//     .take(limit)
//     .value();
// }
// function talkInc({ wxid, wxname, room, db }) {
//   const divers = db.data.divers || [];
//   let roomobj = lodash.chain(divers).find({ room }).value();
//   if (!roomobj) {
//     roomobj = { room, talks: [] };
//     divers.push(roomobj);
//   }
//   let talker = lodash.chain(roomobj.talks).find({ wxid }).value();
//   if (!talker) {
//     talker = { wxid, wxname, count: 1 };
//     roomobj.talks.push(talker);
//   } else {
//     talker.talk += 1;
//     talker.wxname = wxname;
//     console.log(`${talker.talk * 1},${talker.attend * 20}, ${talker.create * 50}`);
//     talker.active = talker.talk * 1 + talker.attend * 20 + talker.create * 50;
//   }
//   db.data.divers = divers;
//   db.write();
// }

