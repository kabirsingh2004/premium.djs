const { Message, PermissionFlagsBits, Client } = require("discord.js");
const moment = require("moment");
const Code = require("../../../Models/Code");
const User = require("../../../Models/User");

module.exports = {
  name: "redeem",
  description: `redeem premium codes`,
  userPermissions: PermissionFlagsBits.SendMessages,
  botPermissions: PermissionFlagsBits.SendMessages,
  category: "Misc",
  cooldown: 5,
  /**
   *
   * @param {Client} client
   * @param {Message} message
   * @param {String[]} args
   * @param {String} prefix
   */
  run: async (client, message, args, prefix) => {
    // Code
    let code = args.join(" "); // `!redeem ABCD-EFGH-IJKL`
    let user = await User.findOne({
      Id: message.author.id, // if you are using slash commands, swap message with interaction.
    });
    // Return an error if the User does not include any Premium Code
    if (!code) {
      return message.reply({
        content: `**Please specify the code you want to redeem!**`,
      });
    } else if (user && user?.isPremium) {
      // If the user is already a premium user, we dont want to save that so we return it.
      return message.reply({
        content: `**> You already are a premium user**`,
      });
    } else {
      // Check if the code is valid within the database
      const premium = await Code.findOne({
        code: code.toUpperCase(),
      });

      // Set the expire date for the premium code
      if (premium) {
        const expires = moment(premium.expiresAt).format(
          "dddd, MMMM Do YYYY HH:mm:ss"
        );
        // Once the code is expired, we delete it from the database and from the users profile
        user.isPremium = true;
        user.premium.redeemedBy.push({
          id: message.author.id,
          tag: message.author.tag,
        });
        user.premium.redeemedAt = Date.now();
        user.premium.expiresAt = premium.expiresAt;
        user.premium.plan = premium.plan;

        // Save the User within the Database
        user = await user.save({ new: true }).catch(() => {});
        client.userSettings.set(message.author.id, user);
        await premium.deleteOne().catch(() => {});

        // Send a success message once redeemed
        return message.reply({
          content: `**You have successfully redeemed premium!**\n\n\`Expires at: ${expires}\``,
        });

        // Error message if the code is not valid.
      } else {
        return message.reply({
          content: `**The code is invalid. Please try again using valid one!**`,
        });
      }
    }
  },
};
