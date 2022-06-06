import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { saveAct, hasActFinish } from '../libs/activity.js';
import { isDayTime, hasActFull, isAct, getOrganizer, getShortName, getActContent, getDate, getActDesc, getEast8time, getNameFromShare, isMiniprogramPublisherId } from '../libs/utils.js';
import { startPayRequire, sbTransfer, sbPayed, getPays } from '../libs/pay.js';
import { informPays } from '../libs/msg.js';
import { contributeRank, checkThisSeasonOrder, checkThisMonthOrganize, saveMiniProgramPublicId, getOrderTimeSpan, isOrderTime, delContributerInDB, addNewMember, checkThisWeekRegister, resetMembersAndStoreOldData, ifWxnameIsEmpty } from '../libs/utils/ordersrc.js';
import { getDateFromVal, getTomorrow, getNow } from '../libs/utils/date.js';
import { savePersonFindAct, findPersonFindAct, delPersonFindAct  } from '../libs/utils/inform.js';
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
const y = `5月29日 周天
场地:省体副馆
时间:14:30-17:30
4号
单4人，双6人，
亚4AA

1、凛风
2、
3、
4、
5、
6`;
const collection = 'contribution';
const roomname = '市体订场互助群';
console.log(new Date(1654496900366));
// const d = '2022-05-20 07:10:00';
// const dn = getDateFromVal('2022-05-20 07:10:00');
// console.log(dn);
// console.log(checkThisSeasonOrder({ db, roomname }));
// console.log(checkThisWeekRegister({ db, roomname }));
// console.log(checkThisMonthOrganize({ db, roomname }));
console.log(savePersonFindAct({ db, roomname, wxid: 'abc222' }));
// console.log(delPersonFindAct({ db, roomname, wxid: 'abc222' }));
// console.log(findPersonFindAct({ db, roomname }));
// console.log(saveMiniProgramPublicId({ db, roomname, actinfo: '<publisherId>wxapp_wx9c78bd45eed84f8apages/actinfo/index.html?id=f6e08a646284318403b0547c31c392f5</publisherId>'}));
// const res = [{'wxname':'张三'},{'wxname':'李四'}];
// console.log(`成员：${res.map(s => s.wxname).join('、')}，因贡献度为负已被劝退！`);
// const b = '" 浮云泪痕"通过扫描"林汀"分享的二维码加入群聊';
// console.log(`【${getNameFromShare(b)}】`);
// // 让人加入群测试一下
// const divers = ['abc', 'abc1', 'wxid_zqptk9a2wmwo21', 'cba' ];
// console.log(ifWxnameIsEmpty({ db, roomname, collection, wxid: 'abc1', wxname: 'abc1abc1abc1' }));
// delContributerInDB({ db, collection, roomname, divers });
// addNewMember({ db, roomname, collection, wxid: 'nbc2', wxname: '新加入3', status: 2 });
// delContributerInDB({ db, collection, roomname, divers });
// const res = checkThisWeekRegister({ db, roomname });
// let str;
// if (res.suc) {
//     str = `成员：${res.data.join('、')}\n\n上周签到数不足3次,将扣除相应的贡献度.\n贡献度为负时将被劝退.\n#10 查看我的贡献度`;
// } else {
//     str = res.msg;
// }
// console.log(str);
// const d1 = new Date();
// console.log(d1);
// setTimeout(() => {
//     const d2 = new Date();
//     console.log(d2);
//     console.log(d2.getTime() - d1.getTime());
//   }, 5 * 1000);

// let a = [ 1, 2, 3 ];
// console.log(a.slice(0, 2));
// a = a.slice(0, 2);
// console.log(a);
// console.log(startPayRequire({ db, act: y, roomname: room }));
// console.log('(已付款) 罗伯特'.replace('(已付款)', '').replace(/(^\s*)|(\s*$)/g, ''));
// console.log(sbTransfer({ db, wxid: 'wxid_zqptk9a2wmwo21', wxname: '林汀', roomname: room }));

// console.log(sbPayed({ db, transferid: 'wxid_7iamaquxeufz22', receiverid: 'wxid_zqptk9a2wmwo21', title: '5月7日\n1. 林汀', roomname: room }));
// console.log(informPays({ roomname: '测试群', db }));
// const pays = getPays({ roomname: '测试群', db });
// console.log(pays);
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

