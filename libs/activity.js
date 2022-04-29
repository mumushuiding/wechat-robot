import lodash from 'lodash';
import { getActContent, getDate } from './utils.js';
/**
 * saveAct 缓存活动信息
 * @param {*} room 是群名称 actinfo 活动内容
 */
export function saveAct({ room, db, actinfo }) {
  if (!room || room === '' || !actinfo || actinfo === '') return;
  const b = getActContent(actinfo);
  if (!b) return;
  const activitys = db.data.activitys || [];
  let roomobj = lodash.chain(activitys).find({ room }).value();
  if (!roomobj) {
    roomobj = { room, acts: [] };
    activitys.push(roomobj);
  }
  roomobj.acts = roomobj.acts || [];
  // 判断活动信息是否存在，存在就更新，不存在就从头部插入
  const index = roomobj.acts.findIndex(v => {
    const a = getActContent(v);
    if (!a) return false;
    return a === b;
  });
  if (index !== -1) {
    roomobj.acts[index] = actinfo;
    // 如果包含：活动取消 就删除
    if (actinfo.includes('活动取消')) roomobj.acts.splice(index, 1);
  } else {
    roomobj.acts.push(actinfo);
  }
  // 判断是否超过5个
  if (roomobj.acts.length > 5) roomobj.acts.splice(0, 1);
  db.data.activitys = activitys;
  db.write();
}
/**
   * getActs 缓存活动信息
   * @param {*} room 是群名称
   */
export function getActs({ room, db }) {
  if (!room || room === '' || !db) return [];
  const activitys = db.data.activitys || [];
  const roomobj = lodash.chain(activitys).find({ room }).value();
  if (!roomobj) {
    return [];
  }
  return lodash.chain(roomobj.acts).take(5)
    .value();
}
/**
 * hasActFinish 判断活动是否过期
 * @param {*} act 活动内容
 */
export function hasActFinish(act) {
  // 获取日期
  const date = getDate(act);
  if (!date) return true;
  const now = new Date();
  const flag = date.getTime() <= now.getTime();
  // console.log('活动开始时间：' + date.toString() + ',是否过期:' + flag);
  return flag;
  // 获取时间
}
