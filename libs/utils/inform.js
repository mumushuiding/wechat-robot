import lodash from 'lodash';
const INFORMS_COLLECTION = 'informs';
import { getNow, getTomorrow } from './date.js';
export function savePersonFindAct({ roomname, db, wxid }) {
  if (!roomname || !db || !wxid) return '保存失败';
  const informs = db.data.informs || [];
  let roomobj = lodash.chain(informs).find({ roomname }).value();
  if (!roomobj) {
    roomobj = { roomname, findActs: [], refreshtime: 0 };
    informs.push(roomobj);
  }
  roomobj.findActs = roomobj.findActs || [];
  // 判断是否超时，超时就设置成空，并重置下次超时时间
  const now = getNow();
  roomobj.refreshtime = roomobj.refreshtime || 0;
  if (now.getTime() >= roomobj.refreshtime) {
    roomobj.findActs = [];
    // 设置下次刷新时间
    roomobj.refreshtime = getTomorrow().getTime(now);
  }
  const index = roomobj.findActs.findIndex(v => {
    return v === wxid;
  });
  if (index !== -1) return '已登记';
  // 判断是否人已满
  if (roomobj.findActs.length >= 10) return '名额已用完,下次请早';
  roomobj.findActs.push(wxid);
  db.data.informs = informs;
  db.write();
  return '登记成功,当有人转发活动时会通知你';
}
export function findPersonFindAct({ db, roomname }) {
  const room = db.chain.get(INFORMS_COLLECTION).find({ roomname }).value();
  if (!room || !room.findActs) return [];
  return room.findActs;
}
export function delPersonFindAct({ db, roomname, wxid }) {
  if (!wxid) return '取消失败';
  const index = db.chain.get(INFORMS_COLLECTION).findIndex({ roomname }).value();
  if (index === -1) return '没登记过,回复【#找场】进行登记';
  const room = db.data[INFORMS_COLLECTION][index];
  const inx = room.findActs.findIndex(a => a === wxid);
  if (inx === -1) return '没登记过,回复【#找场】进行登记';
  room.findActs.splice(inx, 1);
  db.write();
  return '取消成功';
}
