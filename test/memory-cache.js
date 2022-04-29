import cache from 'memory-cache';

cache.put('wxid#activity', true, 1000);

console.log('当前 wxid#activity:' + cache.get('wxid#activity'));

setTimeout(() => {
  console.log('2秒后,wxid#activity:' + cache.get('wxid#activity'));
}, 2000);
setTimeout(() => {
  console.log('3秒后,wxid#activity:' + cache.get('wxid#activity'));
}, 3000);
