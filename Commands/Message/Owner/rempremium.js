const { Message, PermissionFlagsBits, Client } = require("discord.js");
const User = require("../../../Models/User");

module.exports = {
  name: "rempremium",
  description: `remove premium from user`,
  userPermissions: PermissionFlagsBits.SendMessages,
  botPermissions: PermissionFlagsBits.SendMessages,
  category: "Owner",
  /**
   *
   * @param {Client} client
   * @param {Message} message
   * @param {String[]} args
   * @param {String} prefix
   */
  run: async (client, message, args, prefix) => {
    // Code
    if (message.author.id !== "882481863661342770") return;
    const user =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);
    if (!user) {
      return message.reply({
        content: `> Mention a User `,
      });
    }
    let data = client.userSettings.get(user.id);
    if (!data?.isPremium) {
      return message.reply({
        content: `\`${user.user.username}\` is Not a Premium User`,
      });
    } else {
      await User.findOneAndRemove({ Id: user.id });
      await client.userSettings.delete(user.id);
      return message.reply({
        content: `Premium Removed From \`${user.user.username}\``,
      });
    }
  },
};
