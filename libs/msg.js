import { statistic, talkRank, delDiversInDB, clearDivers } from './statistic.js';
import { getJsonFromFilePath, hasActFull, isDayTime, getDate } from './utils.js';
import { getActs, hasActFinish } from './activity.js';
import { getAttendPersonIDs } from './user.js';
import { getPays, getPayInfo } from './pay.js';
import { isOrderTime, checkThisWeekRegister, checkThisMonthOrganize, checkThisSeasonOrder, resetMembersAndStoreOldData, getContributeLowMsg } from './utils/ordersrc.js';
import { savePersonFindAct, delPersonFindAct } from './utils/inform.js';
import { orderstat } from './order.js';
import { findRoomInfos } from './room.js';
const DEFAULT_OWNERID = 'wxid_zqptk9a2wmwo21';
const embrassed = [ '|(-_-)|', '╮(￣▽ ￣)╭ ', '(￣(工)￣)', '(*+﹏+*)', '⊙﹏⊙‖∣°', '一 一+' ];
export async function onMessage(bot, msg, db) {
  let roomtopic = '';
  let res;
  if (msg.room()) roomtopic = await msg.room().topic();
  const contact = msg.talker();
  // 订场群统计
  orderstat({ msg, contact, roomname: roomtopic, db, bot });
  // ----------------------以下为活动统计 -------------------------
  const arr = [ '福州羽毛球健身群', '测试群' ];
  if (arr.findIndex(v => v === roomtopic) === -1) {
    console.log('----只统计群：' + arr.join(','));
    return;
  }
  if (msg.text() === '#0') {
    await msg.say('活跃度 = 发言次数*1 + 组织次数*80 + 参与次数*20\n');
    return;
  }
  if (msg.text() === '#1' || msg.text() === '#等级') {
    const x = getJsonFromFilePath('../datas/羽毛球等级.json');
    if (x && x.infos) {
      const text = x.infos.map((v1, i) => {
        return '等级' + (i + 1) + '\n' + v1.map(v2 => v2.text).join('\n');
      }).join('\n\n');
      await msg.say(text);
    }
    return;
  }
  if (msg.text() === '#2' || msg.text() === '#潜水员') { // 查询潜水人员
    if (roomtopic) {
      const res = await talkRank({ db, topic: roomtopic, collection: 'divers', limit: 10, isAsc: true });
      if (res.length > 0) {
        res.forEach(x => {
          if (!x.wxname) {
            const d = bot.Contact.load(x.wxid);
            x.wxname = d.name();
          }
        });
        await msg.say(res.map(v => `【${v.wxname}】组织:${v.create},参与:${v.attend},活跃度:${v.active}`).join('\n\n'));
      } else {
        msg.say('暂无数据');
      }
    }
    return;
  }
  if (/^#3/g.test(msg.text())) { // 踢除潜水人员
    if (roomtopic) {
      const room = msg.room();
      const collection = 'divers';
      const res = await talkRank({ db, topic: roomtopic, collection, limit: 10, isAsc: true });
      if (res.length > 0) {
        const owner = room.owner();
        const isOwner = owner && owner.id === contact.id;
        if (isOwner || contact.id === DEFAULT_OWNERID) {
          // 删除数据
          await delDiversInDB({ db, collection: 'divers', topic: roomtopic, divers: res });
          msg.say('成员数据已删除!');
        } else {
          msg.say('没有权限！');
          return;
        }
        if (!isOwner) {
          msg.say('无法自动踢人,请手动删除！');
          return;
        }
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
            console.log(`${c.id},${c.name()},已被删除`);
          } else {
            console.log(`${c.id},${c.name()},还存在`);
          }
        });
      }
    }
    return;
  }
  if (/^#4/g.test(msg.text().trim())) { // 获取近期活动
    const acts = getActs({ room: roomtopic, db });
    if (acts.length > 0) {
      acts.forEach(act => msg.say(act));
    } else {
      msg.say('暂无');
    }
    return;
  }
  if (/^#5/g.test(msg.text())) {
    await msg.say('4月24日 星期\n球馆：\n场地:\n时间：19:00~22:30\n上限：6人\n1、');
    msg.say('按格式转发,可自动帮转\n标记【#收款16.2元】可帮助收款; #6');
    return;
  }
  if (/^#6/g.test(msg.text())) {
    const pays = getPays({ roomname: roomtopic, db });
    if (pays && pays.length > 0) {
      pays.forEach(p => msg.say(getPayInfo(p)));
    } else {
      msg.say('无未付款纪录！');
    }
    return;
  }
  if (msg.text() === '#9') {
    if (contact.id === DEFAULT_OWNERID) {
      const t = await clearDivers({ room: roomtopic, db, bot });
      if (t) {
        msg.say(t);
        return;
      }
    } else {
      msg.say('没有权限！');
      return;
    }

  }
  if (/机器人/g.test(msg.text()) && /傻|呆|蠢|笨|楞|白痴|憨|2B|2b/g.test(msg.text())) {
    const t = embrassed[Math.ceil(Math.random() * (embrassed.length - 1))];
    msg.say(t + '这只是个程序!');
  }
  if (/停止转发/g.test(msg.text())) {
    msg.say('修改报名上限或在接龙中标记【人已满】可停止转发活动!');
    return;
  }
  if (/^#找场$/g.test(msg.text())) {
    res = savePersonFindAct({ roomname: roomtopic, db, wxid: contact.id });
    if (res) msg.say(res);
    return;
  }
  if (/^#不找场$/g.test(msg.text())) {
    res = delPersonFindAct({ db, roomname: roomtopic, wxid: contact.id });
    if (res) msg.say(res);
    return;
  }
  statistic({ msg, contact, room: roomtopic, db, bot });
}
export async function informAct({ bot, db, roomname }) {
  if (!bot || !db) return;
  if (!isDayTime()) return;
  const arr = [];
  // 查询有效的活动
  const acts = getActs({ room: roomname, db });
  if (!acts || acts.length === 0) return;
  const room = await bot.Room.find({ topic: roomname });
  if (!room) return;
  acts.forEach(t => {
    const fu = hasActFull(t);
    const fi = hasActFinish(t);
    // console.log(`${t.substring(0, 10)} 是否结束: ${fi}, 是否满：${fu}, 是否通知:${!fi && !fu}`);
    if (!fi && !fu) arr.push(t);
  });
  console.log(`------可参与活动数${arr.length}--------`);
  if (arr.length > 0) {
    arr.forEach(a => {
      room.say(a);
    });
    room.say('格式匹配,自动转发 #5。\n标记【人已满】可提前停止转发\n标记【活动取消】可删除接龙');
  }
}
export async function informPays({ bot, roomname, db }) {
  if (!isDayTime()) return;
  const now = new Date();
  console.log(`${now} INFO -----${roomname}-提醒收款----`);
  const pays = getPays({ roomname, db });
  if (!pays || pays.length === 0) return;
  const room = await bot.Room.find({ topic: roomname });
  if (!room) return;
  if (pays && pays.length > 0) {
    pays.forEach(p => room.say(getPayInfo(p)));
    room.say('末尾标记【款收齐】可提前关闭收款通知');
  }
}
export async function informAttends({ bot, roomname, db }) {
  const now = new Date();
  console.log(`${now} INFO -----提醒参加活动----`);
  if (!bot || !db) return;
  // if (!isDayTime()) return;
  // 查询有效的活动
  const acts = getActs({ room: roomname, db });
  if (!acts || acts.length === 0) return;
  const room = await bot.Room.find({ topic: roomname });
  if (!room) return;
  acts.forEach(act => {
    if (!(/活动取消/.test(act))) {
      const d1 = getDate(act);
      if (d1) {
        const d2 = (d1.getTime() - now.getTime()) / 3600000;
        if (d2 < 2 && d2 >= 0.3) {
          // 通知参与人员
          const cs = [];
          const wxids = getAttendPersonIDs({ act, roomname, db });
          if (wxids.length > 0) {
            wxids.forEach(id => {
              const c = bot.Contact.load(id);
              cs.push(c);
            });
            for (let i = 1; i < 13; i++) {
              cs.push('');
            }
            room.say(act);
            room.say `记得参加活动哦!鸽了也要平摊费用!\n\n标记【活动取消】则不通知\n${cs[0]} ${cs[1]}${cs[2]} ${cs[3]}${cs[4]}${cs[5]} ${cs[6]}${cs[7]} ${cs[8]}${cs[9]} ${cs[10]}${cs[11]} ${cs[12]}`;
          }
        }
      }
    }
  });
}
export async function informOrder({ bot, roomname, db }) {
  if (!isOrderTime()) return;
  const room = await bot.Room.find({ topic: roomname });
  if (!room) return;
  room.say('回复【3】签到');
  let res = checkThisWeekRegister({ db, roomname });
  if (res.suc) room.say(res.data);
  res = checkThisSeasonOrder({ db, roomname });
  if (res.suc) room.say(res.data);
  res = checkThisMonthOrganize({ db, roomname });
  if (res.suc) room.say(res.data);
  const str = getContributeLowMsg({ db, roomname, bot });
  if (str) room.say(str);
}
// resetMembers 查询群成员并更新，类型为订场的群，对应集合是 contribution
export async function refreshMembers({ bot, db, roomname }) {
  console.log(`------------更新【${roomname}】的成员-------`);
  const roominfos = await findRoomInfos({ bot, topic: roomname });
  const members = roominfos.memberIdList;
  resetMembersAndStoreOldData({ db, roomname, members });
}
