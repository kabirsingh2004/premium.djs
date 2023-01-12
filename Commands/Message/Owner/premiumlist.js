const {
  Message,
  PermissionFlagsBits,
  Client,
  EmbedBuilder,
} = require("discord.js");
const moment = require("moment");

module.exports = {
  name: "premiumlist",
  description: `show all premium users`,
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

    let data = client.userSettings
      .filter((data) => data?.isPremium === true)
      .map((data) => {
        return `<@${data.Id}> **Plan** : \`${
          data.premium.plan
        }\` **Expire At** :  <t:${Math.floor(
          data.premium.expiresAt / 1000
        )}:F> `;
      });

    message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`All Premium Users`)
          .setColor("Blurple")
          .setDescription(data.join("\n") || "No Premium User Found"),
      ],
    });
  },
};
