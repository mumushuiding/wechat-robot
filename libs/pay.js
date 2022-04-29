import lodash from 'lodash';
import { getActContent, getOrganizer, getAttendPerson } from './utils.js';
import { findUserFromDB } from './user.js';
export function startPayRequire({ db, act, roomname }) {
  if (!db || !act || !roomname) return { suc: false, err: '发起收款失败' };
  // 获取标题
  const title = getActContent(act);
  if (!title) return { suc: false, err: '活动未按格式填写，发起失败，回复: #5' };
  // 获取收款人
  const wxname = getOrganizer(act);
  if (!wxname) return { suc: false, err: '无法获取组织者呢称,请修改后重试' };
  const rs = findUserFromDB({ wxname, collection: 'divers', roomname, db, fuzzy: true });
  if (rs.length === 0) return { suc: false, err: '找不到叫: 【' + wxname + '】的人,可修改名称重试' };
  if (rs.length > 1) return { suc: false, err: '群呢称【' + wxname + '】存在重复,无法发起' };
  const receiver = rs[0];
  // 获取付款人列表,查询wxid
  const attendlist = getAttendPerson(act);
  if (attendlist.length === 0) return { suc: false, err: '找不到参与人员' };
  const attends = [];
  const wxids = [];
  // {wxid,wxname,exist,err}
  attendlist.forEach(a => {
    const temp = {};
    if (a.includes('(已付款)')) {
      a = a.replace('(已付款)', '').replace(/(^\s*)|(\s*$)/g, '');
      temp.pay = 1;
    }
    temp.wxname = a;
    const x = findUserFromDB({ wxname: a, collection: 'divers', roomname, db, fuzzy: true });
    if (x.length === 0) {
      temp.err = '(无此人,修改名称重试)';
    } else if (x.length > 1) {
      temp.err = '(重名,,修改名称重试)';
    } else {
      temp.wxid = x[0].wxid;
      temp.exist = 1;
      if (!temp.pay) {
        wxids.push(x[0].wxid);
      }
    }
    if (receiver.wxid === temp.wxid) temp.pay = 1;
    attends.push(temp);
  });
  const amount = _getAmount(act);
  // 保存指定活动，判断是否已经存在
  const pay = {
    title,
    receiver,
    attends,
    desc: act.substring(0, 30),
    amount,
  };
  const ret = [ amount, wxids ];
  if (savePay({ db, pay, roomname })) {
    let msg = pay.desc + '\n收款人:' + pay.receiver.wxname + '\n参与人:\n';
    let i = 0;
    attends.forEach(a => {
      i++;
      msg = msg.concat(i + '.' + (a.pay ? '(已付款)' : '') + a.wxname + ' ' + (a.err ? '  ' + a.err : '') + '\n');
    });
    ret.push(msg);
    return { suc: true, data: ret };
  }
  return { suc: false, err: '保存失败,重新发起' };
}
function getPayInfo(pay) {
  let msg = pay.desc + '\n收款人:' + pay.receiver.wxname + '\n参与人:\n';
  let i = 0;
  pay.attends.forEach(a => {
    i++;
    msg = msg.concat(i + '.' + (a.pay ? '(已付款)' : '') + a.wxname + ' ' + (a.err ? '  ' + a.err : '') + '\n');
  });
  msg = msg.concat('#我要收款' + pay.amount + '元');
  return msg;
}
export function savePay({ db, pay, roomname }) {
  if (!pay) return 'pay为空,发起失败';
  const pays = db.data.pays || [];
  let ps = lodash.chain(pays).find({ room: roomname }).value();
  if (!ps) {
    ps = { room: roomname, pays: [] };
    pays.push(ps);
  }
  const index = ps.pays.findIndex(p => p.title === pay.title && pay.receiver.wxid === p.receiver.wxid);
  if (index !== -1) {
    ps.pays[index] = pay;
  } else {
    ps.pays.unshift(pay);
    if (ps.pays.length > 50) {
      ps.pays = ps.pays.slice(0, 49);
    }
  }
  db.data.pays = pays;
  db.write();
  return 1;
}
export function sbPayed({ db, transferid, receiverid, title, roomname }) {
  const pays = db.data.pays || [];
  let ps = lodash.chain(pays).find({ room: roomname }).value();
  if (!ps) {
    ps = { room: roomname, pays: [] };
    pays.push(ps);
  }
  const index = ps.pays.findIndex(p => p.title === title && receiverid === p.receiver.wxid);
  if (index === -1) {
    return { suc: false, err: '付款纪录失败!' };
  }
  const p = ps.pays[index];
  if (!p.attends) return { suc: false, err: '参与人列表为空！' };
  const i = p.attends.findIndex(a => a.wxid === transferid);
  p.attends[i].pay = 1;
  db.data.pays = pays;
  db.write();
  return { suc: true, msg: getPayInfo(p) };
}
export function sbTransfer({ db, wxid, roomname }) {
  if (!wxid) return { suc: false, err: 'wxid为空' };
  // 查询可能付给谁
  const pays = db.data.pays || [];
  // 找到某个群的收款
  const ps = lodash.chain(pays).find({ room: roomname }).value();
  if (!ps || !ps.pays || !ps.pays.length) return { suc: true, data: [] };
  const inds = [];
  for (let i = 0; i < ps.pays.length; i++) {
    const temp = ps.pays[i];
    if (temp.attends.some(a => a.wxid === wxid && !a.pay)) {
      inds.push(i);
    }
  }
  const receivers = [];
  const amounts = [];
  const titles = [];
  inds.forEach(i => {
    receivers.push(ps.pays[i].receiver);
    amounts.push(ps.pays[i].amount);
    titles.push(ps.pays[i].title);
  });
  return { suc: true, data: [ receivers, amounts, titles ] };
}
function _getAmount(str) {
  if (!str) return '0';
  const a = str.match(/(?<=#我要收款)[0-9,.]{1,6}/g);
  if (a && a.length) return a[0];
  return '0';
}
