const room = await bot.Room.find({topic: 'wechaty'})

// 4. Send text inside room and mention @mention contact
const contact = await bot.Contact.find({name: 'lijiarui'}) // change 'lijiarui' to any of the room member
await room.say('Hello world!', contact)
const msg = await room.say('Hello world!', contact)

const bot = new Wechaty()
await bot.start()
// after logged in...
const room = await bot.Room.find({topic: 'WeChat'})          // change 'WeChat' to any room topic in your WeChat
const contact = await bot.Contact.find({name: 'lijiarui'})   // change 'lijiarui' to any room member in the room you just set
if (room) {
  try {
     await room.remove(contact)
  } catch(e) {
     console.error(e)
  }
}
