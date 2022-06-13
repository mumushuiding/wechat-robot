import { onMessage, informAct, informAttends, informPays, informOrder, refreshMembers, informFinishActInAhour } from './libs/msg.js';
import { onRoomJoin, onRoomLeave } from './libs/utils/active.js';
import lodash from 'lodash';
import qrcodeTerminal from 'qrcode-terminal';
import {
  ScanStatus,
  WechatyBuilder,
  log,
} from 'wechaty';
import { PuppetXp } from 'wechaty-puppet-xp';
import { join, dirname } from 'path';
import { LowSync, JSONFileSync } from 'lowdb';
import { fileURLToPath } from 'url';
import { setTimeout } from 'timers';
const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, 'db.json');
const adapter = new JSONFileSync(file);
const db = new LowSync(adapter);
db.read();
db.chain = lodash.chain(db.data);
const puppet = new PuppetXp();
const bot = WechatyBuilder.build({
  name: 'ding-dong-bot',
  // puppet: 'wechaty-puppet-xp',
  puppet,
  // puppet: 'wechaty-puppet-service',
  // puppetOptions: {
  //   tls: {
  //     disable: true,
  //   },
  //   token: 'puppet_paimon_9bf25477-7ced-4804-afb6-41f17bd909d1', // !!!!! Please change it !!!!!
  // },
});


function onLogout(user) {
  log.info('StarterBot', '%s logout', user);
}

function onScan(qrcode, status) {
  if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
    const qrcodeImageUrl = [
      'https://wechaty.js.org/qrcode/',
      encodeURIComponent(qrcode),
    ].join('');
    log.info('StarterBot', 'onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl);

    qrcodeTerminal.generate(qrcode, { small: true }); // show qrcode on console

  } else {
    log.info('StarterBot', 'onScan: %s(%s)', ScanStatus[status], status);
  }
}

function onLogin(user) {
  log.info('StarterBot', '%s login', user);
}

async function onMsg(msg) {
  log.info('StarterBot', msg.toString());
  if (msg.text() === 'ding') {
    await msg.say('dong6');
  }
  onMessage(bot, msg, db);
}
// function cronTask() {
//   console.log(`${new Date()} INFO 定时任务------------------`);
// }
function _infoAttends() {
  const groups = [ '福州羽毛球健身群', '测试群' ];
  // const groups = [ '测试群' ];
  groups.forEach(a => {
    informAct({ bot, db, roomname: a });
    setTimeout(() => {
      informAttends({ bot, roomname: a, db });
    }, 10 * 60 * 1000);
  });
}
function _infoFinishAct() {
  const groups = [ '福州羽毛球健身群', '测试群' ];
  groups.forEach(a => {
    informFinishActInAhour({ bot, db, roomname: a });
  });
}
function _infoPays() {
  const groups = [ '福州羽毛球健身群', '测试群' ];
  // const groups = [ '测试群' ];
  groups.forEach(a => {
    informPays({ bot, db, roomname: a });
  });
}
function _informOrder() {
  const groups = [ '测试群', '市体订场互助群' ];
  groups.forEach(a => {
    informOrder({ bot, db, roomname: a }); // 提醒签到
  });
}
function _refreshMembers() {
  const groups = [ '测试群', '市体订场互助群' ];
  groups.forEach(a => {
    refreshMembers({ bot, db, roomname: a }); // 提醒签到
  });
}
bot.on('scan', onScan);
bot.on('login', onLogin);
bot.on('logout', onLogout);
bot.on('message', onMsg);
bot.on('room-join', async (room, inviteeList, inviter) => {
  onRoomJoin({ room, inviter, db });
  // console.log(`Room ${await room.topic()} got new member ${nameList}, invited by ${inviter}`);
});
bot.on('room-leave', async (room, leaverList, remover) => {
  onRoomLeave({ room, leaverList, remover, db });
  const nameList = leaverList.map(c => c.name()).join(',');
  console.log(`Room ${await room.topic()} lost member ${nameList}, the remover is: ${remover}`);
});
bot.on('room-invite', async roomInvitation => {
  console.log(JSON.stringify(roomInvitation));
  // "超超超哥"邀请你加入了群聊，群聊参与人还有：瓦力
  try {
    log.info('received room-invite event.');
    await roomInvitation.accept();
  } catch (e) {
    console.error(e);
  }
});
bot.start()
  .then(async () => {
    log.info('StarterBot', 'Starter Bot Started.');
    setTimeout(() => {
      // _infoAttends();
      // _refreshMembers();
      // _infoFinishAct();
    }, 15000);
    setInterval(() => {
      _infoAttends(); // 通知参与活动
      setTimeout(() => {
        _infoFinishAct();
      }, 5 * 60 * 1000);
      setTimeout(() => {
        _infoPays();
      }, 15 * 60 * 1000);
    }, 1 * 3600 * 1000);
    setInterval(_informOrder, 10 * 60 * 1000);
    setInterval(_refreshMembers, 24 * 3600 * 1000);
  })
  .catch(e => log.error('StarterBot', e));

