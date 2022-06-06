//  ********************* 订场贡献度 *****************************
import lodash from 'lodash';
import path from 'path';
import fs from 'fs';
import { getNow, isMonday, isFirstDayOfMonth } from './date.js';
const ROBOT_ID = 'wxid_7iamaquxeufz22';
export const KICKLIMIT = 2;
export const Degrees = {
  organize: 10,
  order: 30,
  register: 1,
  invite: 2,
  punish: -15,
};
export const Assess = {
  weekregister: 3,
  monthorganize: 1,
  seasonorder: 2,
};
// 用户状态
export const Status = {
  normal: 2,
  leave: 1,
};
// 新用户设置下次考核时间
export const NextTimeCheck = {
  register: 7 * 3600 * 24 * 1000, // 7天后
  organize: 30 * 24 * 3600 * 1000, // 30天后
  order: 90 * 24 * 3600 * 1000, // 80天后
};
const CON_TABLE = 'contribution';
// 是否是订场的时间
export function getOrderTimeSpan() {
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(path.resolve('config.json')), { encodeing: 'utf-8' });
  } catch (error) {
    console.log(error);
  }
  if (!config) {
    console.log('config.json 配置文件不存在');
    return null;
  }
  // "order_timespan":[[6,25,40],[7,25,40]]
  if (!config.order_timespan) {
    console.log('config.json 配置文件中order_timespan字段为空');
    return null;
  }
  return config.order_timespan;
}
export function isOrderTime(date) {
  // console.log('-----------------判断是否是订场时间---------------------');
  let now = date || new Date();
  const salt = 8;
  now = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + salt, now.getMinutes(), 0, 0);
  const timespans = getOrderTimeSpan();
  if (!timespans) return false;
  const time = now.getTime();
  if (timespans.some(t => {
    const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), t[0] + salt, t[1], 0, 0);
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), t[0] + salt, t[2], 0, 0);
    // console.log(now);
    // console.log(d1);
    // console.log(d2);
    return time >= d1.getTime() && time <= d2.getTime();
  })) return true;
  // console.log('----------是订场时间段');
  // const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6 + salt, 28, 0, 0);
  // const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6 + salt, 40, 0, 0);
  // const d3 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7 + salt, 28, 0, 0);
  // const d4 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7 + salt, 40, 0, 0);
  // console.log(now);
  // console.log(d3);
  // console.log(d4);
  // if ((time >= d1.getTime() && time <= d2.getTime()) || (time >= d3.getTime() && time <= d4.getTime())) {
  //   return true;
  // }
  return false;
}
// 保存活动,如果活动不存在返回true,已经存在返回false
export function saveMiniProgramPublicId({ roomname, db, actinfo }) {
  if (!roomname || roomname === '' || !actinfo || actinfo === '') return false;
  const miniprograms = db.data.miniprograms || [];
  const b = actinfo;
  let roomobj = lodash.chain(miniprograms).find({ roomname }).value();
  if (!roomobj) {
    roomobj = { roomname, acts: [] };
    miniprograms.push(roomobj);
  }
  roomobj.acts = roomobj.acts || [];
  // 判断活动信息是否存在，存在就更新，不存在就从头部插入
  const index = roomobj.acts.findIndex(v => {
    const a = v;
    if (!a) return false;
    return a === b;
  });
  if (index !== -1) {
    console.log('-------------接龙已经存在--------------');
    return false;
  }
  roomobj.acts.push(actinfo);
  // 判断是否超过100个
  if (roomobj.acts.length > 50) roomobj.acts.splice(0, 1);
  db.data.miniprograms = miniprograms;
  db.write();
  return true;
}
export function getContributeLowMsg({ db, roomname, bot }) {
  const res = contributeRank({ db, roomname, collection: CON_TABLE, limit: KICKLIMIT, isAsc: true });
  let str;
  if (res.length > 0) {
    res.forEach(x => {
      if (!x.wxname) {
        const d = bot.Contact.load(x.wxid);
        x.wxname = d.name();
      }
    });
    str = res.map(v => `${v.wxname}: 贡献度:${v.degree}`).join('\n\n');
    str += '\n\n手动踢除用户后,回复【#3】清除用户数据';
  }
  return str;
}
// 贡献度排行
export function contributeRank({ db, roomname, collection, limit, isAsc }) {
  const room = db.chain.get(collection).find({ roomname }).value();
  if (!room || !room.cons) return [];
  return lodash.chain(room.cons).filter(function(v) {
    return v.status === Status.normal && v.wxid !== ROBOT_ID && v.degree < 0;
  }).orderBy('degree', isAsc ? 'asc' : 'desc')
    .take(limit)
    .value();
}
// 查询我的贡献度
export function getMyCon({ db, collection, roomname, wxid }) {
  const room = db.chain.get(collection).find({ roomname }).value();
  if (!room || !room.cons) return [];
  return lodash.chain(room.cons).filter(function(v) {
    return v.wxid === wxid;
  }).take(1)
    .value();
}
// 添加新成员
export async function addNewMember({ db, roomname, collection, wxid, wxname }) {
  if (!wxid) return;
  const contributions = db.data[collection] || [];
  let roomobj = lodash.chain(contributions).find({ roomname }).value();
  if (!roomobj) {
    roomobj = { roomname, cons: [] };
    contributions.push(roomobj);
  }
  let c = lodash.chain(roomobj.cons).find({ wxid }).value();
  if (!c) {
    c = initContribution({ wxid, wxname, status: Status.normal });
    roomobj.cons.push(c);
  } else {
    c.status = Status.normal;
    c.wxname = wxname;
  }
  db.write();
}
// 添加新成员
export async function ifWxnameIsEmpty({ db, roomname, collection, wxid, wxname }) {
  const contributions = db.data[collection] || [];
  let roomobj = lodash.chain(contributions).find({ roomname }).value();
  if (!roomobj) {
    roomobj = { roomname, cons: [] };
    contributions.push(roomobj);
  }
  let c = lodash.chain(roomobj.cons).find({ wxid }).value();
  if (!c) {
    c = initContribution({ wxid, wxname, status: Status.normal });
    roomobj.cons.push(c);
    db.write();
    return;
  }
  if (!c.wxname || c.status !== Status.normal) {
    c.status = Status.normal;
    c.wxname = wxname;
    db.write();
  }
}
// 踢除贡献度低的成员
export async function delContributerInDB({ db, collection, roomname, divers }) {
  if (!divers || divers.length === 0) return;
  const index = db.chain.get(collection).findIndex({ roomname }).value();
  if (index === -1) return;
  const room = db.data[collection][index];
  // 将中队
  room.cons = lodash.chain(room.cons).pullAllBy(divers, 'wxid').value();
  divers.forEach(d => {
    d.status = Status.leave;
    room.cons.push(d);
  });
  db.write();
}
// 检查每季度订场次数
export function checkThisSeasonOrder({ db, roomname }) {
  const now = getNow();
  if (!isFirstDayOfMonth(now)) {
    console.log('--------今天是：');
    console.log(now.getDate());
    console.log('号，不是1号,无须检查【成功订场】次数-------------');
    return { suc: false };
  }
  const collection = CON_TABLE;
  const contributions = db.data[collection] || [];
  const roomobj = lodash.chain(contributions).find({ roomname }).value();
  if (!roomobj) {
    return { suc: false };
  }
  const arr = [];
  if (roomobj.lastTimeCheckOrder) {
    const ok = (now.getTime() - roomobj.lastTimeCheckOrder) > 1000 * 3600 * 24 * 70;
    if (!ok) {
      console.log('---------------没到下次检查【成功订场】次数的时间---------');
      return { suc: false };
    }
  }
  roomobj.cons.forEach(c => {
    c.seasonorder = c.seasonorder || 0;
    c.punish = c.punish || 0;
    if (c.status === Status.normal && c.seasonorder < Assess.seasonorder && c.wxid !== ROBOT_ID) { // 每周签到数不足
      if (now.getTime() >= c.nextTimeCheckOrder) {
        c.punish++;
        c.degree += Degrees.punish;
        arr.push(c.wxname);
      } else {
        console.log(`-----------【${c.wxname}】豁免本次【成功订场】次数检查-------------`);
      }
    }
    c.nextTimeCheckOrder = 0;
    c.seasonorder = 0;
  });
  roomobj.lastTimeCheckOrder = now.getTime();
  db.write();
  if (arr.length > 0) {
    return { suc: true, data: `成员：${arr.join('、')}\n上季度成功订场不足${Assess.seasonorder},扣${Degrees.punish}分. #10 ` };
  }
  console.log('-----------上季度成功订场不足的成员为0-------------');
  return { suc: false };
}
// 检查每月组织次数
export function checkThisMonthOrganize({ db, roomname }) {
  const now = getNow();
  if (!isFirstDayOfMonth(now)) {
    console.log('--------今天是：');
    console.log(now.getDate());
    console.log('号，不是1号,无须检查组织次数-------------');
    return { suc: false };
  }
  const collection = CON_TABLE;
  const contributions = db.data[collection] || [];
  const roomobj = lodash.chain(contributions).find({ roomname }).value();
  if (!roomobj) {
    return { suc: false };
  }
  const arr = [];
  if (roomobj.lastTimeCheckOrganize) {
    const ok = (now.getTime() - roomobj.lastTimeCheckOrganize) > 1000 * 3600 * 24 * 10;
    if (!ok) {
      console.log('---------------没到下次检查组织次数的时间---------');
      return { suc: false };
    }
  }
  roomobj.cons.forEach(c => {
    c.monthorganize = c.monthorganize || 0;
    c.punish = c.punish || 0;
    if (c.status === Status.normal && c.monthorganize < Assess.monthorganize && c.wxid !== ROBOT_ID) { // 每周签到数不足
      if (now.getTime() >= c.nextTimeCheckOrganize) {
        c.punish++;
        c.degree += Degrees.punish;
        arr.push(c.wxname);
      } else {
        console.log(`-----------【${c.wxname}】豁免本次组织次数检查-------------`);
      }
    }
    c.nextTimeCheckOrganize = 0;
    c.monthorganize = 0;
  });
  roomobj.lastTimeCheckOrganize = now.getTime();
  db.write();
  if (arr.length > 0) {
    return { suc: true, data: `成员：${arr.join('、')}\n上月组织次数不足${Assess.monthorganize}次,扣${Degrees.punish}分. #10 ` };
  }
  console.log('-----------上月组织次数不足的成员为0-------------');
  return { suc: false };
}
// 检查本周签到数
export function checkThisWeekRegister({ db, roomname }) {
  const now = getNow();
  if (!isMonday(now)) {
    console.log('--------今天是星期：');
    console.log(now.getDay());
    console.log('不是星期一，不用检查签到-------------');
    return { suc: false };
  }
  const collection = CON_TABLE;
  const contributions = db.data[collection] || [];
  const roomobj = lodash.chain(contributions).find({ roomname }).value();
  if (!roomobj) {
    return { suc: false };
  }
  const arr = [];
  if (roomobj.lastTimeChekRegister) {
    const ok = (now.getTime() - roomobj.lastTimeChekRegister) > 1000 * 3600 * 24 * 2;
    if (!ok) {
      console.log('---------------没到下次检查签到的时间---------');
      return { suc: false };
    }
  }
  console.log('---------------检查签到情况---------');
  roomobj.cons.forEach(c => {
    c.weekregister = c.weekregister || 0;
    c.punish = c.punish || 0;
    if (c.status === Status.normal && c.weekregister < Assess.weekregister && c.wxid !== ROBOT_ID) { // 每周签到数不足
      if (now.getTime() >= c.nextTimeCheckRegister) {
        c.punish++;
        c.degree += Degrees.punish;
        arr.push(c.wxname);
      } else {
        console.log(`-----------【${c.wxname}】豁免本次签到检查-------------`);
      }
    }
    c.nextTimeCheckRegister = 0;
    c.weekregister = 0;
  });
  roomobj.lastTimeChekRegister = now.getTime();
  db.write();
  if (arr.length > 0) {
    console.log(`成员：${arr.join('、')}\n上周签到数不足${Assess.weekregister}次,扣${Degrees.punish}分. #10 `);
    return { suc: true, data: `成员：${arr.join('、')}\n上周签到数不足${Assess.weekregister}次,扣${Degrees.punish}分. #10 ` };
  }
  console.log('-----------本周签到数不足的成员为0-------------');
  return { suc: false };
}
// 重置用户并保存旧的数据
export function resetMembersAndStoreOldData({ db, roomname, members }) {
  if (!members) return 'members 为空';
  if (!roomname || roomname === '') return;
  const contributions = db.data[CON_TABLE] || [];
  const roomobj = lodash.chain(contributions).find({ roomname }).value();
  if (!roomobj) return CON_TABLE + '集合为空';
  const cons = roomobj.cons || [];
  if (cons.length === 0) return 'cons 为空';
  members.forEach(wxid => {
    const inx = cons.findIndex(c => c.wxid === wxid);
    if (inx === -1) {
      cons.push(initContribution({ wxid }));
    } else {
      cons[inx].status = Status.normal;
    }
  });
  roomobj.cons = cons;
  db.write();
  return '成功';
}
// 初始化数据
export function initContribution({ wxid, wxname }) {
  // weekregister 本周签到数
  const now = getNow();
  const time = now.getTime();
  return { wxid, wxname, organize: 0, order: 0, register: 0, weekregister: 0, monthorganize: 0, seasonorder: 0, invite: 0, degree: 0, punish: 0, status: Status.normal, nextTimeCheckRegister: NextTimeCheck.register + time, nextTimeCheckOrganize: NextTimeCheck.organize + time, nextTimeCheckOrder: NextTimeCheck.order + time };
}
export function consToString(c) {
  return `贡献度:${c.degree},本周签到:${c.weekregister}\n本月组织:${c.monthorganize ? c.monthorganize : 0}\n本季订到场:${c.seasonorder ? c.seasonorder : 0}\n扣分:${c.punish}次 \n\n以下为历史数据:\n订场:${c.order},组织:${c.organize}\n邀请:${c.invite},签到:${c.register}`;
}
