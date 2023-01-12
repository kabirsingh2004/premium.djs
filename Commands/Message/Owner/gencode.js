const {
  Message,
  PermissionFlagsBits,
  Client,
  EmbedBuilder,
} = require("discord.js");
const moment = require("moment");
const voucher_codes = require("voucher-code-generator");
const schema = require("../../../Models/Code");

module.exports = {
  name: "gencode",
  description: `generate premium codes`,
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
    const plans = ["daily", "weekly", "monthly", "yearly"];
    const plan = args[0];
    const amount = args[1] || 1;
    const codes = [];
    let time;
    if (!plans.includes(plan)) {
      return message.reply(`Avalible Plans :: \n > \`${plans.join(", ")}\``);
    }
    if (plan === "daily") time = Date.now() + 86400000;
    if (plan === "weekly") time = Date.now() + 86400000 * 7;
    if (plan === "monthly") time = Date.now() + 86400000 * 30;
    if (plan === "yearly") time = Date.now() + 86400000 * 365;

    for (let i = 0; i < amount; i++) {
      const codePremium = voucher_codes.generate({
        pattern: "####-####-####",
      });
      // Save the Code as a String ("ABCDEF ...") in the Database
      const code = codePremium.toString().toUpperCase();
      // Security check, check if the code exists in the database.
      const find = await schema.findOne({
        code: code,
      });
      // If it does not exist, create it in the database.
      if (!find) {
        schema.create({
          code: code,
          plan: plan,
          expiresAt: time,
        });
        // Push the new generated Code into the Queue
        codes.push(`${i + 1}- ${code}`);
      }
    }
    // message.reply({
    //   content: `\`\`\`Generated +${codes.length}\n\n--------\n${codes.join(
    //     "\n"
    //   )}\n--------\n\nType - ${plan}\nExpires - ${moment(time).format(
    //     "dddd, MMMM Do YYYY"
    //   )}\`\`\`\nTo redeem, use \`${prefix}redeem <code>\``,
    // });
    message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Blurple")
          .setTitle(`Generated ${codes.length} Codes`)
          .setDescription(
            `\`\`\`\n${codes.join("\n") || "No Codes Generated"} \`\`\``
          )
          .addFields([
            {
              name: `Expire At`,
              value: `<t:${Math.floor(time / 1000)}:F>`,
            },
          ])
          .setFooter({
            text: `To redeem, use ${prefix}redeem <code>`,
          }),
      ],
    });
  },
};
