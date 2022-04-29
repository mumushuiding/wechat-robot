export async function findRoomMembers({ bot, topic }) {
  const roomList = await bot.Room.findAll({ topic });
  let members = [];
  if (roomList && roomList.length > 0) {
    members = roomList[0].payload.memberIdList;
  }
  return members || [];
}
export async function findRoomInfos({ bot, topic }) {
  const roomList = await bot.Room.findAll({ topic });
  if (roomList && roomList.length > 0) {
    return roomList[0].payload;
  }
  return {};
}
