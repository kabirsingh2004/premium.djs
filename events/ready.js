const { ActivityType } = require("discord.js");
const client = require("../index");
const User = require("../Models/User");

client.on("ready", async () => {
  console.log(`bot is ready for work !!`);
  client.user.setActivity({
    name: `Coded By Kabir ❤️‍🔥`,
    type: ActivityType.Watching,
  });

  // premium system loader
  const users = await User.find();
  users.forEach((user) => client.userSettings.set(user.Id, user));
});
