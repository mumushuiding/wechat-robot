import lodash from 'lodash';
import { getNow } from './date.js';
import { findRoomInfos } from './room.js';
export const Degrees = {
  create: 80,
  attend: 20,
  invite: 40,
  punish: -15,
  talk: 1,
};
// 用户状态
export const Status = {
  normal: 2,
  leave: 1,
};
// 时间
export const TIMES = {
  freshertime: 30 * 24 * 3600 * 1000, // 30天后
};
const DIVERS_TABLE_NAME = 'divers';
// 初始化数据
export function initActive({ wxid, wxname }) {
  // weekregister 本周签到数
  const now = getNow();
  const time = now.getTime();
  return { wxid, wxname, curtalk: 0, curattend: 0, curcreate: 0, curinvite: 0, talk: 0, attend: 0, create: 0, invite: 0, active: 0, punish: 0, status: Status.normal, freshertime: time + TIMES.freshertime };
}
// 打印活跃指数
export function activeToString(c) {
  return `当前活跃度:${c.active || 0}\n组织:${c.curcreate || 0},参与:${c.curattend || 0}\n邀请:${c.curinvite || 0},发言:${c.curtalk || 0}\n\n以下为历史累计:\n组织:${c.create || 0},参与:${c.attend || 0}\n邀请:${c.invite || 0},发言:${c.talk || 0}`;
}
// 打印当前活跃指数
export function getCurActiveToString(c) {
  return `活跃度:${c.active || 0},组织:${c.curcreate || 0},参与:${c.curattend || 0},发言:${c.curtalk || 0}`;
}
// 查询我的贡献度
export function getMyActive({ db, roomname, wxid }) {
  const room = db.chain.get(DIVERS_TABLE_NAME).find({ room: roomname }).value();
  if (!room || !room.talks) return [];
  return lodash.chain(room.talks).filter(function(v) {
    return v.wxid === wxid;
  }).take(1)
    .value();
}
// 活跃度增加
export async function activeInc({ room, db, bot, wxid, wxname, num }) {
  if (!room || room === '') return '';
  const divers = db.data[DIVERS_TABLE_NAME] || [];
  let roomobj = lodash.chain(divers).find({ room }).value();
  if (!roomobj && bot) {
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
  let c = lodash.chain(roomobj.talks).find({ wxid }).value();
  if (!c) {
    c = initActive({ wxid, wxname });
    roomobj.talks.push(c);
  } else {
    c.wxname = wxname;
    c.status = Status.normal;
  }
  c.active += num;
  let str;
  switch (num) {
    case Degrees.talk:
      c.talk++;
      c.curtalk = c.curtalk || 0;
      c.curtalk++;
      break;
    case Degrees.create:
      c.create++;
      c.curcreate = c.curcreate || 0;
      c.curcreate++;
      str = '组织了一场活动! 活跃度+' + Degrees.create + ';\n回复【#10】 查看活跃度';
      break;
    case Degrees.attend:
      c.attend++;
      c.curattend = c.curattend || 0;
      c.curattend++;
      str = '参与活动! 活跃度+' + Degrees.attend + ';\n回复【#10】 查看活跃度';
      break;
    case Degrees.invite:
      c.invite = c.invite || 0;
      c.invite++;
      c.curinvite = c.curinvite || 0;
      c.curinvite++;
      str = '邀请新人!活跃度+' + Degrees.invite + ';\n回复【#10】 查看活跃度';
      break;
    default:
      console.log('出现了新的类型，需要设置一下');
      break;
  }
  db.data[DIVERS_TABLE_NAME] = divers;
  db.write();
  return str;


}
// 清除活跃度
export function clearActive({ room, db }) {
  const divers = db.data[DIVERS_TABLE_NAME] || [];
  const roomobj = lodash.chain(divers).find({ room }).value();
  if (!roomobj) {
    console.log('----------数据不存在------');
    return '';
  }
  roomobj.talks.forEach(t => {
    t.active = 0;
    t.curattend = 0;
    t.curcreate = 0;
    t.curinvite = 0;
    t.curtalk = 0;
  });
  db.data[DIVERS_TABLE_NAME] = divers;
  db.write();
  return '成员活跃度清零';

}
/**
 * getActiveRank 发言次数排行
 * @param {*} db 数据库，topic 群名称，collection 集合名称
 */
export function getActiveRank({ db, topic }) {
  const room = db.chain.get(DIVERS_TABLE_NAME).find({ room: topic }).value();
  if (!room || !room.talks) return [];
  const time = new Date().getTime();
  return lodash.chain(room.talks).filter(function(v) {
    return !v.freshertime || (v.freshertime && time >= v.freshertime);
  }).orderBy('active', 'asc')
    .take(10)
    .value();
}
// 有人加入了群聊
export async function onRoomJoin({ room, inviter, db }) {
  room.say('欢迎加入群聊 ,请按格式：业余2级-晋安-中文昵称 修改群呢称！\n回复：\n\n#1: 可查询等级\n#10: 可查询活跃度\n#4: 可查询近期活动\n#5: 查看接龙格式');
  const res = await activeInc({ room: await room.topic(), db, wxid: inviter.id, wxname: inviter.name(), num: Degrees.invite });
  if (res) room.say(res, inviter);
}
// 有人离开了群聊
export async function onRoomLeave({ room, leaverList, remover, db }) {
  console.log(JSON.stringify(leaverList));
  console.log(JSON.stringify(remover));
  const nameList = leaverList.map(c => c.name()).join(',');
  room.say(`${nameList} 离开了群聊`);
  delUsersInDB({ db, topic: await room.topic(), divers: [{ wxid: remover.id }] });
  console.log('删除成员数据成功');
}
// 删除指定id的人员
export async function delUsersInDB({ db, topic, divers }) {
  if (!divers || divers.length === 0) return;
  const index = db.chain.get(DIVERS_TABLE_NAME).findIndex({ room: topic }).value();
  if (index === -1) return;
  const room = db.data[DIVERS_TABLE_NAME][index];
  room.talks = lodash.chain(room.talks).pullAllBy(divers, 'wxid').value();
  db.write();
}

