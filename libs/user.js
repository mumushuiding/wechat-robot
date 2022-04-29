import lodash from 'lodash';
export function findUserFromDB({ wxname, collection, roomname, db, fuzzy }) {
  const room = db.chain.get(collection).find({ room: roomname }).value();
  if (!room || !room.talks) return [];
  const cs = lodash.chain(room.talks).filter(function(v) {
    return !fuzzy ? v.wxname === wxname : (v.wxname && v.wxname.includes(wxname));
  }).take(10)
    .value();
  return cs || [];
}
