import lodash from 'lodash';
import { getAttendPerson } from './utils.js';
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
export function findUserFromDB({ wxname, collection, roomname, db, fuzzy }) {
  const room = db.chain.get(collection).find({ room: roomname }).value();
  if (!room || !room.talks) return [];
  const cs = lodash.chain(room.talks).filter(function(v) {
    return !fuzzy ? v.wxname === wxname : (v.wxname && v.wxname.includes(wxname));
  }).take(10)
    .value();
  return cs || [];
}
export function getAttendPersonIDs({ act, roomname, db }) {
  // 获取付款人列表,查询wxid
  const attendlist = getAttendPerson(act);
  if (attendlist.length === 0) return [];
  const wxids = [];
  // {wxid,wxname,exist,err}
  attendlist.forEach(a => {
    const x = findUserFromDB({ wxname: a, collection: 'divers', roomname, db, fuzzy: true });
    if (x.length === 1) {
      wxids.push(x[0].wxid);
    }
  });
  return wxids;
}
