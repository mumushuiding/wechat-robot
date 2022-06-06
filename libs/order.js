// 订场群贡献度统计
import lodash from 'lodash';
import { findRoomInfos } from './room.js';
import { getNameFromShare, getMiniprogramPublisherId } from './utils.js';
import { findWxidFromDB } from './user.js';
// import { isAct } from './activity.js';
import { KICKLIMIT, Assess, saveMiniProgramPublicId, contributeRank, initContribution, delContributerInDB, getMyCon, isOrderTime, addNewMember, Degrees, consToString, Status, resetMembersAndStoreOldData, ifWxnameIsEmpty } from './utils/ordersrc.js';
import cache from 'memory-cache';
const DEFAULT_OWNERID = 'wxid_zqptk9a2wmwo21';
const CON_TABLE = 'contribution';
// 需要统计的群
const INFORMS = [ '基本要求: 每周参与订场' + Assess.weekregister + '次,每月组织' + Assess.monthorganize + '次,每季度成功订场' + Assess.seasonorder + '次', '贡献度小于0将被劝退', '活动须优先发这里,可限制等级', '订到场并截图发群里,可加贡献度', '使用小程序组织，可加贡献度', '回复【#10】 查看本人的贡献度', `加减分规则:\n订到场:+${Degrees.order},组织:+${Degrees.organize}\n签到:+${Degrees.register},扣分一次:${Degrees.punish}` ];
const groups = [ '市体订场互助群' ];

export async function orderstat({ msg, contact, roomname, db, bot }) {
  if (!msg || !contact || !db || !bot) return;
  // const name = getNameFromShare('" 浮云2泪痕"通过扫描"林汀"分享的二维码加入群聊');
  // if (name) findByNameOrAliasSaveToDB({ bot, db, name, roomname });
  if (groups.findIndex(g => g === roomname) === -1) return;
  const x = msg.text();
  switch (msg.type()) {
    case bot.Message.Type.Text:
      _isText({ msg, contact, roomname, db, bot });
      break;
    case bot.Message.Type.Image:
      isOrder({ contact, msg, roomname });
      break;
    case bot.Message.Type.MiniProgram:
      if (/<sourcedisplayname>分级接龙工具<\/sourcedisplayname>/i.test(msg.text())) {
        isMiniProgram({ contact, msg, roomname });
      }
      break;
    case bot.Message.Type.Unknown:
      if (/^".+"邀请".+"加入了群聊$/g.test(x)) {
        msg.say('注意看规则,若感觉被冒犯,请及时退群');
        msg.say(INFORMS.join('\n\n'));
        onRoomJoin({ msg, db, bot, roomname });
      }
      if (/^".+"通过扫描".+"分享的二维码加入群聊$/g.test(x)) {
        const name = getNameFromShare(x);
        if (name) {
          console.log('--------------2小时后，查询新人并添加至数据库-----------');
          setTimeout(() => {
            findByNameOrAliasSaveToDB({ bot, db, name, roomname });
          }, 2 * 3600 * 1000);
        }
        msg.say('注意看规则,若感觉被冒犯,请及时退群');
        msg.say(INFORMS.join('\n\n'));
      }
      break;
    default:
      break;
  }
  ifWxnameIsEmpty({ db, roomname, collection: CON_TABLE, wxid: contact.id, wxname: contact.name() });
}
function _isText({ msg, contact, roomname, db, bot }) {
  const x = msg.text();
  // if (isAct(x)) {
  //   msg.say('只统计小程序');
  //   // informActivityOwner({ wxid: contact.id, msg, db, collection: CON_TABLE, roomname, bot });
  //   // saveAct({ room: roomname, db, actinfo: x });
  //   // isActivity({ contact, msg, roomname });
  // }
  let num;
  switch (x) {
    case 1:
    case '1':
      num = Degrees.organize;
      _actInc({ contact, msg, roomname, db, bot, num });
      break;
    case 2:
    case '2':
      num = Degrees.order;
      _orderInc({ contact, msg, roomname, db, bot, num });
      break;
    case '3':
      num = Degrees.register;
      _registerInc({ contact, msg, roomname, db, bot, num });
      break;
    case '#1':
      msg.say(INFORMS.join('\n\n'));
      break;
    case '#10':
      // 查询我的贡献度
      _getMyCon({ db, roomname, msg, wxid: contact.id });
      break;
    case '#2':
      // 查询贡献度低的成员
      getContributeLow({ db, roomname, bot, msg });
      break;
    case '#3':
      // 踢人并将数据status设置为leave状态
      kickContributeLow({ db, msg, roomname, contact, bot });
      break;
      // case '#9': // 不需要清零
      // 贡献度清零
      // clearContribution({ contact, roomname, db, bot, msg });
      // break;
    default:
      break;
  }

}
async function _getMyCon({ db, roomname, msg, wxid }) {
  const res = getMyCon({ db, collection: CON_TABLE, roomname, wxid });
  if (res.length > 0) {
    msg.say(consToString(res[0]));
  } else {
    msg.say('暂无数据');
  }
}
async function getContributeLow({ db, roomname, bot, msg }) {
  const res = contributeRank({ db, roomname, collection: CON_TABLE, limit: KICKLIMIT, isAsc: true });
  if (res.length > 0) {
    res.forEach(x => {
      if (!x.wxname) {
        const d = bot.Contact.load(x.wxid);
        x.wxname = d.name();
      }
    });
    await msg.say(res.map(v => `${v.wxname}: 贡献度:${v.degree}`).join('\n\n'));
  } else {
    msg.say('暂无数据');
  }
}
// async function clearContribution({ contact, roomname, db, bot, msg }) {
//   if (contact.id === DEFAULT_OWNERID) {
//     const t = await _clearContributionDivers({ roomname, collection: CON_TABLE, db, bot });
//     if (t) {
//       msg.say(t);
//       return;
//     }
//   } else {
//     msg.say('没有权限！');
//     return;
//   }
// }
// 贡献度全部清零
// async function _clearContributionDivers({ db, collection, roomname, bot }) {
//   const index = db.chain.get(collection).findIndex({ roomname }).value();
//   const roominfos = await findRoomInfos({ bot, topic: roomname });
//   if (!roominfos) {
//     return '群聊[' + roomname + ']不存在';
//   }
//   const roomobj = { roomname, cons: [] };
//   const members = roominfos.memberIdList || [];
//   roomobj.ownerId = roominfos.ownerId;
//   roomobj.adminIdList = roominfos.adminIdList;
//   members.forEach(wxid => {
//     const c = bot.Contact.load(wxid);
//     roomobj.cons.push(initContribution({ wxid, wxname: c.name() }));
//   });
//   db.data[collection] = db.data[collection] || [];
//   if (index === -1) {
//     db.data[collection].push(roomobj);
//   } else {
//     db.data[collection][index] = roomobj;
//   }
//   db.write();
//   return '成员贡献度清零';
// }
async function kickContributeLow({ db, msg, roomname, contact, bot }) {
  const room = msg.room();
  const collection = CON_TABLE;
  const res = contributeRank({ db, roomname, collection, limit: KICKLIMIT, isAsc: true });
  if (res.length > 0) {
    const owner = room.owner();
    const isOwner = owner && owner.id === contact.id;
    if (isOwner || contact.id === DEFAULT_OWNERID) {
      // 删除数据
      await delContributerInDB({ db, collection, roomname, divers: res });
      msg.say(`成员：${res.map(s => s.wxname).join('、')}，因贡献度为负已被劝退！`);
    } else {
      msg.say('没有权限！');
      return;
    }
    // if (!isOwner) {
    //   msg.say('无法自动踢人,须手动清退！');
    //   return;
    // }
    res.forEach(async v => {
      const c = bot.Contact.load(v.wxid);
      // 判断是否包含该成员
      console.log(`${c.id},${c.name()},将要被删除`);
      try {
        await room.remove(c);
      } catch (e) {
        console.error(e);
      }
      const exist = await room.has(c);
      if (!exist) {
        console.log(`${c.name()}已被删除`);
      } else {
        console.log(`${c.id},${c.name()}还存在`);
      }
    });
  }
}
async function findByNameOrAliasSaveToDB({ bot, db, name, roomname }) {
  const cname = await bot.Contact.find({ name });
  const calias = await bot.Contact.find({ alias: name });
  const c = cname || calias;
  console.log(`根据名称查询新人：[${name}], ${cname},${calias}`);
  if (c && c.id) {
    addNewMember({ db, roomname, collection: CON_TABLE, wxid: c.id, wxname: c.name() });
  } else {
    console.log(`重新查询群成员：[${name}], ${cname},${calias}`);
    const roominfos = await findRoomInfos({ bot, topic: roomname });
    const members = roominfos.memberIdList;
    resetMembersAndStoreOldData({ db, roomname, members });
  }
}
async function onRoomJoin({ msg, db, bot, roomname }) {
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
    await msg.say(`欢迎 ${invitee}`);
    console.log('--------------1小时后，查询新人并添加至数据库-----------');
    setTimeout(() => {
      findByNameOrAliasSaveToDB({ bot, db, name: invitee, roomname });
    }, 2 * 3600 * 1000);
  }
  if (invitor.length > 0) {
    let contact;
    // 从数据库中查询
    const ids = findWxidFromDB({ wxname: invitor, collection: CON_TABLE, roomname, db });
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
      _contributeInc({ roomname, db, bot, contact, msg, num: Degrees.invite });
    }
  }
}

async function _registerInc({ contact, msg, roomname, db, bot, num }) {
  if (!isOrderTime()) {
    msg.say('不是订场时间');
    return;
  }
  const key = `${roomname}#${contact.id}#order#register`;
  const f = cache.get(key);
  if (f !== null) return;
  _contributeInc({ roomname, db, bot, contact, msg, num });
  cache.put(key, true, 2 * 3600 * 1000);
}
async function _orderInc({ contact, msg, roomname, db, bot, num }) {
  const key = `${roomname}#${contact.id}#order`;
  const f = cache.get(key);
  if (f === null) return;
  _contributeInc({ roomname, db, bot, contact, msg, num });
  cache.del(key);
}
async function _actInc({ contact, msg, roomname, db, bot, num }) {
  const key = `${roomname}#${contact.id}#activity`;
  const f = cache.get(key);
  // 判断活动是否存在
  if (f === null) {

    return;
  }
  console.log(`---------活动信息为:${f}---------`);
  if (!saveMiniProgramPublicId({ db, roomname, actinfo: f })) {
    msg.say('活动已经统计过了');
    cache.del(key);
    cache.del(key + '#forward');
    return;
  }
  // // 判断是否真的报名了
  // if (!_hasAttend({ wxid: contact.id, wxname: contact.name(), text: f, msg, roomname })) return;
  // console.log('-------------我参加了活动---------');
  _contributeInc({ roomname, db, bot, contact, msg, num });
  cache.del(key);
}
async function _contributeInc({ roomname, db, bot, contact, msg, num }) {
  if (!roomname || roomname === '') return;
  const contributions = db.data[CON_TABLE] || [];
  let roomobj = lodash.chain(contributions).find({ roomname }).value();
  // console.log('jjjjjjjjjjjjjjjjjj');
  // console.log(roomobj);
  if (!roomobj) {
    roomobj = { roomname, cons: [] };
    const roominfos = await findRoomInfos({ bot, topic: roomname });
    const members = roominfos.memberIdList;
    roomobj.ownerId = roominfos.ownerId;
    roomobj.adminIdList = roominfos.adminIdList;
    members.forEach(wxid => {
      roomobj.cons.push(initContribution({ wxid }));
    });
    contributions.push(roomobj);
  }
  let c = lodash.chain(roomobj.cons).find({ wxid: contact.id }).value();
  if (!c) {
    // 为新成员
    c = initContribution({ wxid: contact.id, wxname: contact.name() });
    roomobj.cons.push(c);
  } else {
    c.wxname = contact.name();
    c.status = Status.normal;
  }
  c.degree += num;
  let str;
  // console.log('hhhhhhhhhhhhhhhhhh');
  // console.log(num);
  switch (num) {
    case Degrees.register:
      c.register++;
      c.weekregister++;
      str = '签到,贡献度+' + Degrees.register;
      break;
    case Degrees.organize:
      c.organize++;
      c.monthorganize = c.monthorganize || 0;
      c.monthorganize++;
      str = '组织了一场活动! 贡献度+' + Degrees.organize;
      break;
    case Degrees.order:
      c.order++;
      c.seasonorder = c.seasonorder || 0;
      c.seasonorder++;
      str = '订到一个场地!贡献度+' + Degrees.order;
      break;
    case Degrees.invite:
      c.invite++;
      str = '邀请新人!贡献度+' + Degrees.order;
      break;
    default:
      console.log('出现了新的类型，需要设置一下');
      break;
  }
  db.data[CON_TABLE] = contributions;
  db.write();
  msg.say(str);
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
  cache.put(key, getMiniprogramPublisherId(msg.text()), 120000);
  cache.put(key + '#forward', true, 3600 * 48 * 1000);
  room.say('\n\n    发起者回复: 1\n\n(60秒内回复有效)', contact);
}
async function isOrder({ contact, msg, roomname }) {
  if (!isOrderTime()) return;
  const key = `${roomname}#${contact.id}#order`;
  // console.log(key);
  const f = cache.get(key);
  const room = msg.room();
  if (f) {
    return;
  }
  cache.put(key, msg.text(), 120000);
  cache.put(key + '#forward', true, 1 * 3600 * 1000);
  room.say('\n\n    订到场回复: 2\n\n(60秒内回复有效)', contact);
}
// function _hasAttend({ text }) {
//   let hasAttend = false;
//   // 判断是否是小程序，是分级接龙小程序返回true
//   if (/<sourcedisplayname>分级接龙工具<\/sourcedisplayname>/i.test(text)) {
//     hasAttend = true;
//   }
//   // if (!wxname) return false;
//   // const arr = [];
//   // const short = getShortName(wxname);
//   // arr.push(short);
//   // if (short !== wxname) arr.push(wxname);
//   // hasAttend = arr.some(n => text.includes(n));
//   // if (!hasAttend) {
//   //   cache.del(`${roomname}#${wxid}#activity`);
//   //   cache.del(`${roomname}#${wxid}#activity#forward`);
//   //   msg.say(`接龙中没看到【${arr.join('】或【')}】,建议用以上提及名称报名`);
//   // }
//   return hasAttend;
// }
// async function informActivityOwner({ wxid, msg, db, collection, roomname, bot }) {
//   let wxname = getOrganizer(msg.text());
//   if (wxname === null) return;
//   wxname = wxname.trim();
//   const wxids = findWxidFromDB({ wxname, collection, roomname, db, fuzzy: true });
//   if (wxids.length === 1) {
//     if (wxid !== wxids[0]) {
//       // 判断2分钟内是否通知过了
//       const f = cache.get(`${roomname}#${wxid}#活动被转发`);
//       if (!f) {
//         cache.put(`${roomname}#${wxid}#活动被转发`, true, 120000);
//         const c = bot.Contact.load(wxids[0]);
//         msg.room().say('有人转发了你的活动', c);
//       }
//     }
//   }
// }
