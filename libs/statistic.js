import lodash from 'lodash';
// import { findRoomInfos } from './room.js';
import { getOrganizer, isAct, getShortName, getMiniprogramPagepath, looklikeAct, isMiniprogramPagepath } from './utils.js';
import { saveAct } from './activity.js';
import { startPayRequire, sbPayed, sbTransfer } from './pay.js';
import { saveMiniProgramPublicId } from './utils/ordersrc.js';
import { findPersonFindAct } from './utils/inform.js';
import { activeInc, Degrees } from './utils/active.js';
import cache from 'memory-cache';
export async function statistic({ msg, contact, room, db, bot }) {
  // changeAliasNotice({ msg, contact });
  const x = msg.text();
  switch (msg.type()) {
    case bot.Message.Type.Text:
      if (isAct(x)) {
        // 是否标名AA
        if (!(/费用(.){0,4}AA/g.test(x))) {
          msg.say('本群是非营利群,接龙请标明【费用AA】;回复【#5】 查询活动格式');
        }
        informActivityOwner({ wxid: contact.id, msg, db, collection: 'divers', roomname: room, bot });
        saveAct({ room, db, actinfo: msg.text() });
        isActivity({ contact, msg, roomname: room });
        // 通知找场的人
        informPersonFindActs({ db, roomname: room, msg, bot, transfer: contact.id });
        return;
      } else if (looklikeAct(x)) {
        msg.say('按格式发接龙,会自动帮转;回复【#5】查看接龙格式');
        return;
      }
      if (x === '1' || x === '0') {
        // 活跃度更新
        let num = Degrees.attend;
        if (x === '1') num = Degrees.create;
        _activityInc({ contact, msg, room, db, bot, num });
        return;
      }
      if (/#收款/g.test(x)) {
        // 用户发起收款
        startPay({ msg, db, bot, roomname: room, contact });
        return;
      }
      if (/转账你无需接收|转账待你接收/g.test(x)) {
        console.log('-----------转款---------');
        if (!contact) {
          msg.say('无法识别用户');
          return;
        }
        startTransfer({ msg, contact, db, room });
        return;
      }
      if (/^0[0-9]{1,2}$/g.test(x)) {
        checkTransfer({ contact, text: x, msg, room, db, bot });
        return;
      }
      // 发言加1
      activeInc({ room, db, bot, wxid: contact.id, wxname: contact.name(), num: Degrees.talk });
      break;
    case bot.Message.Type.MiniProgram:
      if (/<sourcedisplayname>分级接龙工具<\/sourcedisplayname>/i.test(msg.text())) {
        // console.log('转发了分级接龙小程序');
        // isActivity({ contact, msg });
        isMiniProgram({ contact, msg, roomname: room });
        // 通知找场的人
        informPersonFindActs({ db, roomname: room, msg, bot, transfer: contact.id });
      }
      break;
    case bot.Message.Type.Unknown:
      // if (/^".+"邀请".+"加入了群聊$/g.test(x)) {
      //   onRoomJoin({ msg, db, bot, room });
      // }
      break;
    default:
      break;
  }
}
async function informPersonFindActs({ db, roomname, msg, bot, transfer }) {
  const wxids = findPersonFindAct({ db, roomname });
  if (wxids.length === 0) return;
  const cs = [];
  wxids.forEach(id => {
    // console.log(`转发人${transfer}，通知人${id}`);
    if (id !== transfer) {
      const c = bot.Contact.load(id);
      cs.push(c);
    }
  });
  if (cs.length === 0) return;
  for (let i = 0; i < 10; i++) {
    cs.push('');
  }
  msg.room().say `有人转发活动了，快报名吧！\n ${cs[0]} ${cs[1]}${cs[2]} ${cs[3]}${cs[4]}${cs[5]} ${cs[6]}${cs[7]} ${cs[8]}${cs[9]}\n回复 【#不找场】 将停止通知`;
}
function checkTransfer({ contact, text, msg, room, db, bot }) {
  if (!contact || !text) return;
  const f = cache.get(`${contact.id}#${room}#activity#transfer`);
  if (f === null) {
    return;
  }
  const transfer = f || [];
  const a = text.match(/[0-9]{1,2}/g);
  let index = -1;
  if (a && a.length) index = parseInt(a[0]);
  if (index === -1 || index > (transfer.length - 1)) {
    msg.room().say('输入有误', contact);
    return;
  }
  const receiver = transfer[index][0];
  const title = transfer[index][1];
  const ret = sbPayed({ db, transferid: contact.id, receiverid: receiver.wxid, title, roomname: room });
  if (!ret.suc) {
    msg.say(ret.err);
    return;
  }
  msg.say(ret.msg);
  const c = bot.Contact.load(receiver.wxid);
  if (c) msg.room().say('', c);
}
async function startTransfer({ msg, contact, db, room }) {
  const ret = sbTransfer({ db, wxid: contact.id, roomname: room });
  if (!ret.suc) {
    msg.say(ret.err);
    return;
  }
  if (ret.data.length === 0) return;
  const users = ret.data[0];
  if (users.length === 0) return;
  // const amounts = ret.data[1];
  const titles = ret.data[2];
  let text = '\n';
  const transfer = [];
  for (let i = 0; i < users.length; i++) {
    text += `\n回复:【0${i}】  确认转给:${getShortName(users[i].wxname)}`;
    transfer.push([ users[i], titles[i] ]);
  }
  cache.put(`${contact.id}#${room}#activity#transfer`, transfer, 60000 * 10);
  text += '\n\n60秒内回复有效';
  msg.room().say(text, contact);
}
async function startPay({ msg, db, bot, roomname, contact }) {
  // 是不是组织者
  const x = msg.text();
  const org = getOrganizer(x);
  if (!contact.name().includes(org)) {
    msg.say('你不是组织者');
    return;
  }
  const ret = startPayRequire({ db, act: x, roomname });
  if (!ret.suc) {
    msg.say(ret.err);
    return;
  }
  const amount = ret.data[0];
  const wxids = ret.data[1];
  const payinfo = ret.data[2];
  const cs = [];
  wxids.forEach(id => {
    const c = bot.Contact.load(id);
    cs.push(c);
  });
  for (let i = 1; i < 27; i++) {
    cs.push('');
  }
  msg.say(payinfo);
  msg.room().say `转账${amount}元给【${org}】\n\n转账后根据提示回复\n\n 末尾标记【款收齐】结束收款 \n\n ${cs[0]} ${cs[1]}${cs[2]} ${cs[3]}${cs[4]}${cs[5]} ${cs[6]}${cs[7]} ${cs[8]}${cs[9]} ${cs[10]}${cs[11]} ${cs[12]}${cs[13]} ${cs[14]}${cs[15]} ${cs[16]}${cs[17]}${cs[18]} ${cs[19]}${cs[20]} ${cs[21]}${cs[22]} ${cs[23]}${cs[24]} ${cs[25]}`;

}

// room 为群聊名称
async function onRoomJoin({ msg, db, bot, room }) {
  const x = msg.text();
  const a = x.match(/^"(.+)"邀请/i);
  let invitor = ''; // 邀请人
  if (a && a.length === 2) {
    invitor = a[1];
  }
  let invitee = ''; // 受邀人
  const b = x.match(/邀请"(.+)"加入了群聊$/i);
  if (b && b.length === 2) {
    invitee = b[1];
  }
  if (invitee.length > 0) {
    await msg.say(`欢迎 ${invitee} ,请按格式：‘业余2级-晋安-中文昵称’修改群呢称！\n回复：\n\n#1: 可查询等级\n#10: 可查询活跃度\n#4: 可查询近期活动\n#5: 查看接龙格式`);
  }
  if (invitor.length > 0) {
    let contact;
    // 从数据库中查询
    const ids = findWxidFromDB({ wxname: invitor, collection: 'divers', roomname: room, db });
    const contactlist = [];
    ids.forEach(id => {
      const c = bot.Contact.load(id);
      if (c) contactlist.push(c);
    });
    if (contactlist.length === 1) contact = contactlist[0];
    if (contactlist.length > 1) {
      contactlist.forEach(c => {
        msg.room().say('群昵称与他人重复，请及时修改', c);
      });
      return;
    }
    if (!contact) {
      contact = await bot.Contact.find({ alias: invitor });
    }
    if (contact) {
      const res = await activeInc({ room, db, bot, wxid: contact.id, wxname: contact.name(), num: Degrees.invite });
      if (res) msg.room().say(res, contact);
    }
  }
}
function _hasAttend({ wxname, text, msg }) {
  if (!text) return false;
  console.log(`-------判断用户【${wxname}】是否参与活动------`);
  let hasAttend = false;
  if (!wxname) return false;
  const arr = [];
  const short = getShortName(wxname);
  arr.push(short);
  if (short !== wxname) arr.push(wxname);
  hasAttend = arr.some(n => text.includes(n));
  if (!hasAttend) {
    msg.say(`接龙中没看到【${arr.join('】或【')}】,建议用以上提及名称报名`);
  }
  return hasAttend;
}
async function isMiniProgram({ contact, msg, roomname }) {
  const key = `${roomname}#${contact.id}#activity`;
  const f = cache.get(key + '#forward');
  const room = msg.room();
  if (f) {
    // room.say('6小时内只统计一次!!', contact);
    console.log('----------24小时只统计一次---------');
    return;
  }
  cache.put(key, getMiniprogramPagepath(msg.text()), 120000);
  cache.put(key + '#forward', true, 3600 * 48 * 1000);
  room.say('\n\n    参与者回复: 0\n    发起者回复: 1\n\n(60秒内回复有效)', contact);
}
export function findWxidFromDB({ wxname, collection, roomname, db, fuzzy }) {
  const room = db.chain.get(collection).find({ room: roomname }).value();
  if (!room || !room.talks) return [];
  const cs = lodash.chain(room.talks).filter(function(v) {
    return !fuzzy ? v.wxname === wxname : (v.wxname && v.wxname.includes(wxname));
  }).take(10)
    .value();
  if (cs && cs.length > 0) {
    return cs.map(c => c.wxid);
  }
  return [];
}
async function _activityInc({ contact, msg, room, db, bot, num }) {
  if (!contact) return;
  const key = `${room}#${contact.id}#activity`;
  const f = cache.get(key);
  console.log(`活动内容：${f}`);
  if (!f) return;
  if (isMiniprogramPagepath(f)) { // 是否是小程序的内容
    console.log('----------是小程序---------');
    if (!saveMiniProgramPublicId({ db, roomname: room, actinfo: f })) {
      console.log('-----活动已保存-----------');
      // msg.say('活动已经统计过了');
      // cache.del(key);
      // cache.del(key + '#forward');
      // return;
    }
    // 通知管理员
  } else {
    // 是文字接龙
    if (!_hasAttend({ wxid: contact.id, wxname: contact.name(), text: f, msg, roomname: room })) {
      cache.del(key);
      cache.del(key + '#forward');
      return;
    }
  }
  const str = await activeInc({ room, db, bot, wxid: contact.id, wxname: contact.name(), num });
  if (str) msg.say(str);
  // let isCreate = false;
  // if (msg.text() === '1') {
  //   msg.say('组织了一场活动，赞!');
  //   isCreate = true;
  // }
  // _activeInc({ room, db, bot, contact, isCreate, msg });
  cache.del(key);
}
async function isActivity({ contact, msg, roomname }) {
  const key = `${roomname}#${contact.id}#activity`;
  const f = cache.get(key + '#forward');
  const room = msg.room();
  if (f) {
    // room.say('6小时内只统计一次!!', contact);
    console.log('24小时内只统计一次');
    return;
  }
  cache.put(key, msg.text(), 120000);
  cache.put(key + '#forward', true, 3600 * 24 * 1000);
  room.say('\n\n    参与者回复: 0\n    发起者回复: 1\n\n(60秒内回复有效)', contact);
}
// 删除指定id的人员
export async function delDiversInDB({ db, collection, topic, divers }) {
  if (!divers || divers.length === 0) return;
  const index = db.chain.get(collection).findIndex({ room: topic }).value();
  if (index === -1) return;
  const room = db.data[collection][index];
  room.talks = lodash.chain(room.talks).pullAllBy(divers, 'wxid').value();
  db.write();
}
async function informActivityOwner({ wxid, msg, db, collection, roomname, bot }) {
  let wxname = getOrganizer(msg.text());
  if (wxname === null) return;
  wxname = wxname.trim();
  const wxids = findWxidFromDB({ wxname, collection, roomname, db, fuzzy: true });
  if (wxids.length === 1) {
    if (wxid !== wxids[0]) {
      // 判断2分钟内是否通知过了
      const f = cache.get(`${wxid}#活动被转发`);
      if (!f) {
        cache.put(`${wxid}#活动被转发`, true, 120000);
        const c = bot.Contact.load(wxids[0]);
        msg.room().say('有人转发了你的活动', c);
      }
    }
  }
  // else if (wxids.length === 0) {
  //   msg.say('【' + wxname + '】根据群呢称报名,附赠额外功能');
  // } else {
  //   msg.say('名字【' + wxname + '】与他人重复,很多功能使用不了');
  // }
}
/**
 * _activeInc
 * @param {*} room 为群聊名称
 */
// async function _activeInc({ room, db, bot, contact, isCreate, msg }) {
//   if (!room || room === '') return;
//   const divers = db.data.divers || [];
//   let roomobj = lodash.chain(divers).find({ room }).value();
//   if (!roomobj) {
//     roomobj = { room, talks: [] };
//     const roominfos = await findRoomInfos({ bot, topic: room });
//     const members = roominfos.memberIdList;
//     roomobj.ownerId = roominfos.ownerId;
//     roomobj.adminIdList = roominfos.adminIdList;
//     members.forEach(v => {
//       roomobj.talks.push({ wxid: v, talk: 0, attend: 0, create: 0, active: 0 });
//     });
//     divers.push(roomobj);
//   }
//   let talker = lodash.chain(roomobj.talks).find({ wxid: contact.id }).value();
//   if (!talker) {
//     talker = { wxid: contact.id, wxname: contact.name(), talk: 0, attend: isCreate ? 0 : 1, create: isCreate ? 1 : 0, active: isCreate ? NUMBER_1 : 20, isnew: true };
//     roomobj.talks.push(talker);
//   } else {
//     if (isCreate) {
//       talker.create += 1;
//     } else {
//       talker.attend += 1;
//     }
//     talker.wxname = contact.name();
//     talker.active = talker.talk * 1 + talker.attend * 20 + talker.create * NUMBER_1;
//   }
//   db.data.divers = divers;
//   db.write();
//   msg.say(`${talker.wxname} 组织:${talker.create},参与:${talker.attend},活跃度:${talker.active}`);
// }
/**
 * talkRank 发言次数排行
 * @param {*} db 数据库，topic 群名称，collection 集合名称
 */
// export async function talkRank({ db, topic, collection, limit, isAsc }) {
//   const room = db.chain.get(collection).find({ room: topic }).value();
//   if (!room || !room.talks) return [];
//   return lodash.chain(room.talks).filter(function(v) {
//     return !v.isnew;
//   }).orderBy('active', isAsc ? 'asc' : 'desc')
//     .take(limit)
//     .value();
// }
// export async function talkInc({ wxid, wxname, room, db, bot }) {
//   diversTalkInc({ wxid, wxname, room, db, bot }); // 发言次数统计
// }
// 统计最近的发言次数
// export async function diversTalkInc({ wxid, wxname, room, db, bot }) {
//   if (!room || room === '') return;
//   const divers = db.data.divers || [];
//   let roomobj = lodash.chain(divers).find({ room }).value();
//   if (!roomobj) {
//     roomobj = { room, talks: [] };
//     const roominfos = await findRoomInfos({ bot, topic: room });
//     const members = roominfos.memberIdList || [];
//     roomobj.ownerId = roominfos.ownerId;
//     roomobj.adminIdList = roominfos.adminIdList;
//     members.forEach(v => {
//       roomobj.talks.push({ wxid: v, talk: 0, attend: 0, create: 0, active: 0 });
//     });
//     divers.push(roomobj);
//   }
//   let talker = lodash.chain(roomobj.talks).find({ wxid }).value();
//   if (!talker) {
//     talker = { wxid, wxname, talk: 1, attend: 0, create: 0, active: 0, isnew: true };
//     roomobj.talks.push(talker);
//   } else {
//     talker.talk += 1;
//     talker.wxname = wxname;
//     talker.active = talker.talk * 1 + talker.attend * 20 + talker.create * NUMBER_1;
//   }
//   db.data.divers = divers;
//   db.write();
// }
// export async function clearDivers({ bot, room, db }) {
//   const index = db.chain.get('divers').findIndex({ room }).value();
//   const roominfos = await findRoomInfos({ bot, topic: room });
//   if (!roominfos) {
//     return '群聊[' + room + ']不存在';
//   }
//   const roomobj = { room, talks: [] };
//   const members = roominfos.memberIdList || [];
//   roomobj.ownerId = roominfos.ownerId;
//   roomobj.adminIdList = roominfos.adminIdList;
//   members.forEach(v => {
//     const c = bot.Contact.load(v);
//     roomobj.talks.push({ wxid: v, wxname: c.name(), talk: 0, attend: 0, create: 0, active: 0 });
//   });
//   db.data.divers = db.data.divers || [];
//   if (index === -1) {
//     db.data.divers.push(roomobj);
//   } else {
//     db.data.divers[index] = roomobj;
//   }
//   db.write();
//   return '成员活跃度清零';
// }

