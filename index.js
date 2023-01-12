require("dotenv").config();
const { Client, Partials, Collection } = require("discord.js");
const { TOKEN, MONGO_URL } = require("./settings/config");
const mongoose = require("mongoose");

const client = new Client({
  intents: 3276799,
  // intents: [
  //   GatewayIntentBits.Guilds,
  //   GatewayIntentBits.GuildMembers,
  //   GatewayIntentBits.MessageContent,
  //   GatewayIntentBits.GuildMessages,
  // ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
  ],
  failIfNotExists: false,
  allowedMentions: {
    parse: ["everyone", "roles", "users"],
    users: [],
    roles: [],
    repliedUser: false,
  },
});

mongoose.set("strictQuery", true);

mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`> MongoDB Connected !!`);
  });

// global variables
client.scommands = new Collection();
client.mcommands = new Collection();
client.cooldowns = new Collection();
client.userSettings = new Collection();
client.events = 0;

module.exports = client;

// handlers
const handlesFiles = [
  "event_handler",
  "slash_handler",
  "cmd_handler",
  "premium_handler",
];
handlesFiles.forEach((file) => require(`./handlers/${file}`)(client));

// login bot
client.login(TOKEN);
