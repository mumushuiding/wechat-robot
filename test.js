// taskkill/pid 23276 -t -f
console.log(`pid:${process.pid}`);
// process.on('SIGINT', () => console.log('Received: SIGINT'));
// process.on('SIGQUIT', () => console.log('Received: SIGQUIT'));
// process.on('SIGTERM', () => console.log('Received: SIGTERM'));
setInterval(() => {
  console.log(`i am alive ${new Date()}`);
}, 1000);
setTimeout(() => {
  throw new Error('App is error from inner!');
}, 10000);
