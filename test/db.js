import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { saveAct, hasActFinish, getFinishActsInAhour } from '../libs/activity.js';
import { getMiniprogramPagepath,looklikeAct, getEndDate, isDayTime, hasActFull, isAct, getOrganizer, getShortName, getActContent, getDate, getActDesc, getEast8time, getNameFromShare, isMiniprogramPagepath } from '../libs/utils.js';
import { startPayRequire, sbTransfer, sbPayed, getPays } from '../libs/pay.js';
import { informPays } from '../libs/msg.js';
import { contributeRank, checkThisSeasonOrder, checkThisMonthOrganize, saveMiniProgramPublicId, getOrderTimeSpan, isOrderTime, delContributerInDB, addNewMember, checkThisWeekRegister, resetMembersAndStoreOldData, ifWxnameIsEmpty } from '../libs/utils/ordersrc.js';
import { getDateFromVal, getTomorrow, getNow } from '../libs/utils/date.js';
import { savePersonFindAct, findPersonFindAct, delPersonFindAct  } from '../libs/utils/inform.js';
import { getActiveRank, activeInc, clearActive } from '../libs/utils/active.js';
import { LowSync, JSONFileSync } from 'lowdb';
import lodash from 'lodash';


const __dirname = dirname(fileURLToPath(import.meta.url));

// Use JSON file for storage
const file = join(__dirname, './db.json');
const adapter = new JSONFileSync(file);
const db = new LowSync(adapter);

db.read();
db.chain = lodash.chain(db.data);
// // talkInc({ wxid: 'wxid_zqptk9a2wmwo21', wxname: 'abc', room: '测试群', db });
// talkInc({ wxid: 'wxid_zqptk9a2wmwo21', wxname: 'abc', room: '测试群', db });
// const res = talkRank({ db, topic: '测试群', collection: 'divers', limit: 10, isAsc: false });
// console.log(res);
// if (/^#接龙/g.test('#接龙aagggg')) {
//   console.log('包含 #接龙');
// }
// console.log(findWxidFromDB({ wxname: '业余3-闽侯-小温', collection: 'divers', roomname: '福州羽毛球健身群', db }));
// const ids = findWxidFromDB({ wxname: '业余3-闽侯-小温', collection: 'divers', roomname: '福州羽毛球健身群', db });
// console.log(findAliasIllegal({ collection: 'divers', roomname: '福州羽毛球健身群', db }));
const y = `<?xml version="1.0"?>
<msg>
	<appmsg appid="" sdkver="0">
		<title>06-10 | 福州工人文化宫</title>
		<des />
		<username />
		<action>view</action>
		<type>33</type>
		<showtype>0</showtype>
		<content />
		<url>https://mp.weixin.qq.com/mp/waerrpage?appid=wx9c78bd45eed84f8a&amp;type=upgrade&amp;upgradetype=3#wechat_redirect</url>
		<lowurl />
		<forwardflag>0</forwardflag>
		<dataurl />
		<lowdataurl />
		<contentattr>0</contentattr>
		<streamvideo>
			<streamvideourl />
			<streamvideototaltime>0</streamvideototaltime>
			<streamvideotitle />
			<streamvideowording />
			<streamvideoweburl />
			<streamvideothumburl />
			<streamvideoaduxinfo />
			<streamvideopublishid />
		</streamvideo>
		<canvasPageItem>
			<canvasPageXml><![CDATA[]]></canvasPageXml>
		</canvasPageItem>
		<appattach>
			<attachid />
			<cdnthumburl>3057020100044b304902010002043e55ad1602034c51e60204acd5903a020462a1bed4042432336665626239662d643034362d343064642d623930652d3465613063356337663731610204011800030201000405004c51e600</cdnthumburl>
			<cdnthumbmd5>c55eaa4a5a4e5e730acd010857b7a901</cdnthumbmd5>
			<cdnthumblength>30887</cdnthumblength>
			<cdnthumbheight>576</cdnthumbheight>
			<cdnthumbwidth>720</cdnthumbwidth>
			<cdnthumbaeskey>a8ed48690a5f0ab46790ca787130719e</cdnthumbaeskey>
			<aeskey>a8ed48690a5f0ab46790ca787130719e</aeskey>
			<encryver>1</encryver>
			<fileext />
			<islargefilemsg>0</islargefilemsg>
		</appattach>
		<extinfo />
		<androidsource>0</androidsource>
		<sourceusername>gh_75fd2a9d1bef@app</sourceusername>
		<sourcedisplayname>分级接龙工具</sourcedisplayname>
		<commenturl />
		<thumburl />
		<mediatagname />
		<messageaction><![CDATA[]]></messageaction>
		<messageext><![CDATA[]]></messageext>
		<emoticongift>
			<packageflag>0</packageflag>
			<packageid />
		</emoticongift>
		<emoticonshared>
			<packageflag>0</packageflag>
			<packageid />
		</emoticonshared>
		<designershared>
			<designeruin>0</designeruin>
			<designername>null</designername>
			<designerrediretcturl>null</designerrediretcturl>
		</designershared>
		<emotionpageshared>
			<tid>0</tid>
			<title>null</title>
			<desc>null</desc>
			<iconUrl>null</iconUrl>
			<secondUrl>null</secondUrl>
			<pageType>0</pageType>
		</emotionpageshared>
		<webviewshared>
			<shareUrlOriginal />
			<shareUrlOpen />
			<jsAppId />
			<pagepath>wxapp_wx9c78bd45eed84f8apages/actinfo/index.html?id=058dfefe62a17c6307f615b66348abe8</pagepath>
		</webviewshared>
		<template_id />
		<md5>c55eaa4a5a4e5e730acd010857b7a901</md5>
		<weappinfo>
			<pagepath><![CDATA[pages/actinfo/index.html?id=058dfefe62a17c6307f615b66348abe8]]></pagepath>
			<username>gh_75fd2a9d1bef@app</username>
			<appid>wx9c78bd45eed84f8a</appid>
			<version>41</version>
			<type>3</type>
			<weappiconurl><![CDATA[http://wx.qlogo.cn/mmhead/Q3auHgzwzM6Xk0MGqgWf8rPHKhNXw6fBBD8lUYwGX9fKNFxcnCyYKw/96]]></weappiconurl>
			<shareId><![CDATA[1_wx9c78bd45eed84f8a_cfbd0fe84d51a896da55d6b3d7bf3674_1654768770_0]]></shareId>
			<sharekey><![CDATA[R04qCadeNkF5slKXwXWWv0sHiadpLGEKyBm_H7mrRUWpC-K6xLWcemkPj8lSeaNBcLIcwjUh3qHZfOVNDE_HZig3JUF4gxkZug3DZ8e8W5Q~]]></sharekey>
			<appservicetype>0</appservicetype>
			<secflagforsinglepagemode>0</secflagforsinglepagemode>
			<videopageinfo>
				<thumbwidth>720</thumbwidth>
				<thumbheight>576</thumbheight>
				<fromopensdk>0</fromopensdk>
			</videopageinfo>
		</weappinfo>
		<statextstr />
		<musicShareItem>
			<musicDuration>0</musicDuration>
		</musicShareItem>
		<finderLiveProductShare>
			<finderLiveID />
			<finderUsername />
			<finderObjectID />
			<finderNonceID />
			<liveStatus />
			<appId />
			<pagePath />
			<productId />
			<coverUrl />
			<productTitle />
			<marketPrice><![CDATA[0]]></marketPrice>
			<sellingPrice><![CDATA[0]]></sellingPrice>
			<platformHeadImg />
			<platformName />
			<shopWindowId />
			<flashSalePrice><![CDATA[0]]></flashSalePrice>
			<flashSaleEndTime><![CDATA[0]]></flashSaleEndTime>
		</finderLiveProductShare>
		<finderShopWindowShare>
			<finderUsername />
			<avatar />
			<nickname />
			<commodityInStockCount />
			<appId />
			<path />
			<appUsername />
			<query />
			<liteAppId />
			<liteAppPath />
			<liteAppQuery />
		</finderShopWindowShare>
		<findernamecard>
			<username />
			<avatar><![CDATA[]]></avatar>
			<nickname />
			<auth_job />
			<auth_icon>0</auth_icon>
			<auth_icon_url />
		</findernamecard>
		<finderGuarantee>
			<scene><![CDATA[0]]></scene>
		</finderGuarantee>
		<directshare>0</directshare>
		<gamecenter>
			<namecard>
				<iconUrl />
				<name />
				<desc />
				<tail />
				<jumpUrl />
			</namecard>
		</gamecenter>
		<patMsg>
			<chatUser />
			<records>
				<recordNum>0</recordNum>
			</records>
		</patMsg>
		<secretmsg>
			<issecretmsg>0</issecretmsg>
		</secretmsg>
		<referfromscene>0</referfromscene>
		<websearch>
			<rec_category>0</rec_category>
			<channelId>0</channelId>
		</websearch>
	</appmsg>
	<fromusername>wxid_zqptk9a2wmwo21</fromusername>
	<scene>0</scene>
	<appinfo>
		<version>1</version>
		<appname />
	</appinfo>
	<commenturl />
</msg>`;
const collection = 'contribution';
const room = '测试群';
// console.log(clearActive({ db, room }));
// console.log(await activeInc({ db, room, wxid: 'abc', wxname: '系统', num: 80 }));
console.log(getMiniprogramPagepath(y));
console.log(isMiniprogramPagepath(y));
// const d = '2022-05-20 07:10:00';
// const dn = getDateFromVal('2022-05-20 07:10:00');
// console.log(dn);
// console.log(checkThisSeasonOrder({ db, roomname }));
// console.log(checkThisWeekRegister({ db, roomname }));
// console.log(checkThisMonthOrganize({ db, roomname }));
// console.log(savePersonFindAct({ db, roomname, wxid: 'abc222' }));
// console.log(delPersonFindAct({ db, roomname, wxid: 'abc222' }));
// console.log(findPersonFindAct({ db, roomname }));
// console.log(saveMiniProgramPublicId({ db, roomname, actinfo: '<pagepath>wxapp_wx9c78bd45eed84f8apages/actinfo/index.html?id=f6e08a646284318403b0547c31c392f5</pagepath>'}));
// const res = [{'wxname':'张三'},{'wxname':'李四'}];
// console.log(`成员：${res.map(s => s.wxname).join('、')}，因贡献度为负已被劝退！`);
// const b = '" 浮云泪痕"通过扫描"林汀"分享的二维码加入群聊';
// console.log(`【${getNameFromShare(b)}】`);
// // 让人加入群测试一下
// const divers = ['abc', 'abc1', 'wxid_zqptk9a2wmwo21', 'cba' ];
// console.log(ifWxnameIsEmpty({ db, roomname, collection, wxid: 'abc1', wxname: 'abc1abc1abc1' }));
// delContributerInDB({ db, collection, roomname, divers });
// addNewMember({ db, roomname, collection, wxid: 'nbc2', wxname: '新加入3', status: 2 });
// delContributerInDB({ db, collection, roomname, divers });
// const res = checkThisWeekRegister({ db, roomname });
// let str;
// if (res.suc) {
//     str = `成员：${res.data.join('、')}\n\n上周签到数不足3次,将扣除相应的贡献度.\n贡献度为负时将被劝退.\n#10 查看我的贡献度`;
// } else {
//     str = res.msg;
// }
// console.log(str);
// const d1 = new Date();
// console.log(d1);
// setTimeout(() => {
//     const d2 = new Date();
//     console.log(d2);
//     console.log(d2.getTime() - d1.getTime());
//   }, 5 * 1000);

// let a = [ 1, 2, 3 ];
// console.log(a.slice(0, 2));
// a = a.slice(0, 2);
// console.log(a);
// console.log(startPayRequire({ db, act: y, roomname: room }));
// console.log('(已付款) 罗伯特'.replace('(已付款)', '').replace(/(^\s*)|(\s*$)/g, ''));
// console.log(sbTransfer({ db, wxid: 'wxid_zqptk9a2wmwo21', wxname: '林汀', roomname: room }));

// console.log(sbPayed({ db, transferid: 'wxid_7iamaquxeufz22', receiverid: 'wxid_zqptk9a2wmwo21', title: '5月7日\n1. 林汀', roomname: room }));
// console.log(informPays({ roomname: '测试群', db }));
// const pays = getPays({ roomname: '测试群', db });
// console.log(pays);
// console.log(getOrganizer(y));
// console.log(hasActFinish(y));
// console.log(hasActFull(y));
// console.log(getShortName('业余2.5-台江，蟹老板'));
// console.log(isDayTime());
// console.log(isAct(y));
// let i = 0;
// x.forEach(a => {
//  i++;
//  console.log(`${i},是否满：${hasActFull(a)}，是否过期：${hasActFinish(a)},是否需要通知:${!hasActFull(a) && !hasActFinish(a)}`);
// });
// saveAct({ room, db, actinfo: y });
// console.log(hasActFinish(a));
// function findAliasIllegal({ collection, roomname, db }) {
//   const room = db.chain.get(collection).find({ room: roomname }).value();
//   if (!room || !room.talks) return [];
//   const cs = lodash.chain(room.talks).filter(function(v) {
//     return !/^(业余)?[0-9](\.[0-9]{1})?(级)?-[\u4e00-\u9fa5]{2,4}-[\u4e00-\u9fa5]{1,4}/g.test(v.wxname);
//   }).take(10)
//     .value();
//   if (cs && cs.length > 0) {
//     return cs.map(c => c.wxname);
//   }
//   return [];
// }
// function findWxidFromDB({ wxname, collection, roomname, db }) {
//   const room = db.chain.get(collection).find({ room: roomname }).value();
//   if (!room || !room.talks) return [];
//   const cs = lodash.chain(room.talks).filter(function(v) {
//     return v.wxname === wxname;
//   }).take()
//     .value();
//   if (cs && cs.length > 0) {
//     return cs.map(c => c.wxid);
//   }
//   return [];
// }
// // const text = res.map(v => `成员：${v.wxname}, 发言:${v.talk},组织:${v.create},参与:${v.attend},活跃度:${v.active}`).join('\n\n');
// // console.log(text);
// /**
//  *
//  * @param {*} param0
//  */
// function talkRank({ db, topic, collection, limit, isAsc }) {
// //   const divers = db.data.divers || [];
// //   const room = lodash.chain(divers).find({ room: topic }).value();
//   const room = db.chain.get(collection).find({ room: topic }).value();
//   if (!room || !room.talks) return [];
//   return lodash.chain(room.talks).filter(function(v) {
//     return !v.isnew;
//   }).orderBy('active', isAsc ? 'asc' : 'desc')
//     .take(limit)
//     .value();
// }
// function talkInc({ wxid, wxname, room, db }) {
//   const divers = db.data.divers || [];
//   let roomobj = lodash.chain(divers).find({ room }).value();
//   if (!roomobj) {
//     roomobj = { room, talks: [] };
//     divers.push(roomobj);
//   }
//   let talker = lodash.chain(roomobj.talks).find({ wxid }).value();
//   if (!talker) {
//     talker = { wxid, wxname, count: 1 };
//     roomobj.talks.push(talker);
//   } else {
//     talker.talk += 1;
//     talker.wxname = wxname;
//     console.log(`${talker.talk * 1},${talker.attend * 20}, ${talker.create * 50}`);
//     talker.active = talker.talk * 1 + talker.attend * 20 + talker.create * 50;
//   }
//   db.data.divers = divers;
//   db.write();
// }

