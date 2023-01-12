module.exports = {
  TOKEN: process.env.TOKEN || "BOT_TOKEN",
  PREFIX: process.env.PREFIX || "BOT_PREFIX",
  MONGO_URL: process.env.MONGO_URL || "MONGO_URL",
  Slash: {
    Global: false,
    GuildID: process.env.GuildID || "GUILD_ID",
  },
};
