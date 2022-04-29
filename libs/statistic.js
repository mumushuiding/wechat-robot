import lodash from 'lodash';
import { findRoomInfos } from './room.js';
import { getOrganizer, isAct, getShortName} from './utils.js';
import { saveAct } from './activity.js';
import { startPayRequire, sbPayed, sbTransfer } from './pay.js';
import cache from 'memory-cache';
const NUMBER_1 = 80;
export async function statistic({ msg, contact, room, db, bot }) {
  // changeAliasNotice({ msg, contact });
  const x = msg.text();
  switch (msg.type()) {
    case bot.Message.Type.Text:
      if (/#我要收款/g.test(x)) {
        // 用户发起收款
        startPay({ msg, db, bot, roomname: room, contact });
      } else if (/转账你无需接收|转账待你接收/g.test(x)) {
        console.log('-----------转款---------');
        if (!contact) {
          msg.say('无法识别用户');
          return;
        }
        startTransfer({ msg, contact, db, room });
      } else {
        talkInc({ wxid: contact.id, wxname: contact.name(), room, db, bot });
        if (isAct(x)) {
          informActivityOwner({ wxid: contact.id, msg, db, collection: 'divers', roomname: room, bot });
          saveAct({ room, db, actinfo: msg.text() });
          isActivity({ contact, msg });
        }
      }
      if (msg.text() === 1 || msg.text() === 0 || msg.text() === '1' || msg.text() === '0') {
        // 活跃度更新
        activityInc({ contact, msg, room, db, bot });
      }
      if (/^0[0-9]{1,2}$/g.test(x)) {
        checkTransfer({ contact, text: x, msg, room, db, bot });
      }
      break;
    case bot.Message.Type.MiniProgram:
      if (/<sourcedisplayname>分级接龙工具<\/sourcedisplayname>/i.test(msg.text())) {
        console.log('转发了分级接龙小程序');
        isActivity({ contact, msg });
      }
      break;
    case bot.Message.Type.Unknown:
      if (/^".+"邀请".+"加入了群聊$/g.test(msg.text())) {
        onRoomJoin({ msg, db, bot, room });
      }
      break;
    default:
      break;
  }
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
  cache.put(`${contact.id}#${room}#activity#transfer`, transfer, 60000);
  text += '\n\n30秒内回复有效';
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
  for (let i = 1; i < 13; i++) {
    cs.push('');
  }
  msg.say(payinfo);
  msg.room().say `应转账:${amount}元,给活动组织者 ${cs[0]} ${cs[1]}${cs[2]} ${cs[3]}${cs[4]}${cs[5]} ${cs[6]}${cs[7]} ${cs[8]}${cs[9]} ${cs[10]}${cs[11]} ${cs[12]}`;

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
    await msg.say(`欢迎 ${invitee} ,请按格式：‘业余2级-晋安-中文昵称’修改群呢称！\n回复：\n\n#1： 可查询等级\n#4： 可查询近期活动\n#5： 查看接龙格式`);
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
      await msg.room().say(`邀请新人,活跃度加${NUMBER_1}`, contact);
      _activeInc({ room, db, bot, contact, isCreate: true, msg });
    }
  }
}

/**
 * _activeInc
 * @param {*} room 为群聊名称
 */
async function _activeInc({ room, db, bot, contact, isCreate, msg }) {
  if (!room || room === '') return;
  const divers = db.data.divers || [];
  let roomobj = lodash.chain(divers).find({ room }).value();
  if (!roomobj) {
    roomobj = { room, talks: [] };
    const roominfos = await findRoomInfos({ bot, topic: room });
    const members = roominfos.memberIdList;
    roomobj.ownerId = roominfos.ownerId;
    roomobj.adminIdList = roominfos.adminIdList;
    members.forEach(v => {
      roomobj.talks.push({ wxid: v, talk: 0, attend: 0, create: 0, active: 0 });
    });
    divers.push(roomobj);
  }
  let talker = lodash.chain(roomobj.talks).find({ wxid: contact.id }).value();
  if (!talker) {
    talker = { wxid: contact.id, wxname: contact.name(), talk: 0, attend: isCreate ? 0 : 1, create: isCreate ? 1 : 0, active: isCreate ? NUMBER_1 : 20, isnew: true };
    roomobj.talks.push(talker);
  } else {
    if (isCreate) {
      talker.create += 1;
    } else {
      talker.attend += 1;
    }
    talker.wxname = contact.name();
    talker.active = talker.talk * 1 + talker.attend * 20 + talker.create * NUMBER_1;
  }
  db.data.divers = divers;
  db.write();
  msg.say(`${talker.wxname} 组织:${talker.create},参与:${talker.attend},活跃度:${talker.active}`);
}
function _hasAttend({ wxid, wxname, text, msg }) {
  console.log({ wxid, wxname });
  // 判断是否是小程序，是分级接龙小程序返回true
  if (/<sourcedisplayname>分级接龙工具<\/sourcedisplayname>/i.test(text)) {
    console.log('转发了小程序，算参加');
    return true;
  }
  let hasAttend = false;
  if (!wxname) return false;
  const arr = [];
  const x = wxname.match(/^(.{1,8})?[-, ,_,－,—,—,～,~,/,,,,，].{2,4}[-, ,_,－,—,—,～,~,/,,,,，](.{1,8})/i);
  if (x) {
    arr.push(x[x.length - 1]);
  }
  arr.push(wxname);
  hasAttend = arr.some(n => text.includes(n));
  console.log('hasAttend:' + hasAttend);
  if (!hasAttend) {
    cache.del(`${wxid}#activity`);
    cache.del(`${wxid}#activity#forward`);
    msg.say(`接龙中没看到 ${arr.join('或')},建议用以上提及名称报名`);
  }
  return hasAttend;
}
// 转让场地 transferfield
async function transferfield({ contact, msg, room, db, bot }) {
  if (!contact) return;
  const f = cache.get(`${contact.id}#transferfield`);
  if (f === null) return;
  switch (msg.text()) {
    case '#c0': // 要场地

      break;
    case '#c1': // 要转让
      break;
    default:
      break;
  }
  cache.del(`${contact.id}#transferfield`);
}
async function activityInc({ contact, msg, room, db, bot }) {
  if (!contact) return;
  const f = cache.get(`${contact.id}#activity`);
  if (f === null) return;
  // 判断是否真的报名了
  if (!_hasAttend({ wxid: contact.id, wxname: contact.name(), text: f, msg })) return;
  let isCreate = false;
  if (msg.text() === '1') {
    msg.say('组织了一场活动，赞!');
    isCreate = true;
  }
  _activeInc({ room, db, bot, contact, isCreate, msg });
  cache.del(`${contact.id}#activity`);
}
async function isActivity({ contact, msg }) {
  const f = cache.get(`${contact.id}#activity#forward`);
  const room = msg.room();
  if (f) {
    // room.say('6小时内只统计一次!!', contact);
    return;
  }
  cache.put(`${contact.id}#activity`, msg.text(), 120000);
  cache.put(`${contact.id}#activity#forward`, true, 3600 * 24 * 1000);
  room.say('\n\n    参与者回复: 0\n    发起者回复: 1\n\n(60秒内回复有效)', contact);
}
export async function talkInc({ wxid, wxname, room, db, bot }) {
  diversTalkInc({ wxid, wxname, room, db, bot }); // 发言次数统计
}
// 统计最近的发言次数
export async function diversTalkInc({ wxid, wxname, room, db, bot }) {
  if (!room || room === '') return;
  const divers = db.data.divers || [];
  let roomobj = lodash.chain(divers).find({ room }).value();
  if (!roomobj) {
    roomobj = { room, talks: [] };
    const roominfos = await findRoomInfos({ bot, topic: room });
    const members = roominfos.memberIdList || [];
    roomobj.ownerId = roominfos.ownerId;
    roomobj.adminIdList = roominfos.adminIdList;
    members.forEach(v => {
      roomobj.talks.push({ wxid: v, talk: 0, attend: 0, create: 0, active: 0 });
    });
    divers.push(roomobj);
  }
  let talker = lodash.chain(roomobj.talks).find({ wxid }).value();
  if (!talker) {
    talker = { wxid, wxname, talk: 1, attend: 0, create: 0, active: 0, isnew: true };
    roomobj.talks.push(talker);
  } else {
    talker.talk += 1;
    talker.wxname = wxname;
    talker.active = talker.talk * 1 + talker.attend * 20 + talker.create * NUMBER_1;
  }
  db.data.divers = divers;
  db.write();
}
export async function clearDivers({ bot, room, db }) {
  const index = db.chain.get('divers').findIndex({ room }).value();
  const roominfos = await findRoomInfos({ bot, topic: room });
  if (!roominfos) {
    return '群聊[' + room + ']不存在';
  }
  const roomobj = { room, talks: [] };
  const members = roominfos.memberIdList || [];
  roomobj.ownerId = roominfos.ownerId;
  roomobj.adminIdList = roominfos.adminIdList;
  members.forEach(v => {
    const c = bot.Contact.load(v);
    roomobj.talks.push({ wxid: v, wxname: c.name(), talk: 0, attend: 0, create: 0, active: 0 });
  });
  db.data.divers = db.data.divers || [];
  if (index === -1) {
    db.data.divers.push(roomobj);
  } else {
    db.data.divers[index] = roomobj;
  }
  db.write();
  return '成员活跃度清零';
}
/**
 * talkRank 发言次数排行
 * @param {*} db 数据库，topic 群名称，collection 集合名称
 */
export async function talkRank({ db, topic, collection, limit, isAsc }) {
  const room = db.chain.get(collection).find({ room: topic }).value();
  if (!room || !room.talks) return [];
  return lodash.chain(room.talks).filter(function(v) {
    return !v.isnew;
  }).orderBy('active', isAsc ? 'asc' : 'desc')
    .take(limit)
    .value();
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
  // 从数据库查询可以用户，如果找到多个，找到一个

}