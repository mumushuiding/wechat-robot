import { statistic, talkRank, delDiversInDB, clearDivers } from './statistic.js';
import { getJsonFromFilePath, hasActFull, isDayTime } from './utils.js';
import { getActs, hasActFinish } from './activity.js';
const DEFAULT_OWNERID = 'wxid_zqptk9a2wmwo21';
const embrassed = [ '|(-_-)|', '╮(￣▽ ￣)╭ ', '(￣(工)￣)', '(*+﹏+*)', '⊙﹏⊙‖∣°', '一 一+' ];
export async function onMessage(bot, msg, db) {
  let roomtopic = '';
  if (msg.room()) roomtopic = await msg.room().topic();
  // ----------------------以下为群统计 -------------------------

  const arr = [ '福州羽毛球健身群', '测试群' ];
  if (arr.findIndex(v => v === roomtopic) === -1) {
    console.log('----只统计群：' + arr.join(','));
    return;
  }
  if (msg.text() === '#命令' || msg.text() === '#命令列表' || /不知道怎么玩/g.test(msg.text())) {
    const x = [ '#0  活跃度评定说明', '#1  羽毛球等级明细', '#2 查询潜水人员', '#3 踢除潜水人员', '#4 查询近期活动', '#9 所有成员活跃度清零' ];
    await msg.say(x.join('\n'));
  }
  const contact = msg.talker();
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
        await msg.say(res.map(v => `${v.wxname}  发言:${v.talk},组织:${v.create},参与:${v.attend},活跃度:${v.active}`).join('\n\n'));
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
    msg.say('按格式转发接龙,每小时会自动帮转1次,直到人满或过期');
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
  statistic({ msg, contact, room: roomtopic, db, bot });
}
export async function informAct({ bot, db, roomname }) {
  if (!bot || !db) return;
  if (!isDayTime()) return;
  const arr = [];
  // 查询有效的活动
  const acts = getActs({ room: roomname, db });
  if (!acts || acts.length === 0) return;
  acts.forEach(t => {
    const fi = hasActFinish(t);
    const fu = hasActFull(t);
    console.log(`${t.substring(0, 10)} 是否结束: ${fi}, 是否满：${fu}, 是否通知:${!fi && !fu}`);
    if (!fi && !fu) arr.push(t);
  });
  if (arr.length > 0) {
    const room = await bot.Room.find({ topic: roomname });
    if (!room) return;
    arr.forEach(a => {
      room.say(a);
    });
    room.say('格式匹配,自动转发。查看格式: #5');
  }
}

