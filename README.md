<p align="center">
  <a href="https://discord.gg/PcUVWApWN3" target="blank"><img src="https://media.discordapp.net/attachments/1007230019371802654/1063090222725857371/premium.png" alt="Djs" /></a>
</p>

# Premium.djs

This guide will explain you how to create a Premium System for your Discord.js Bot.

## Requirements

- Basic Knowledge of JavaScript/NodeJS
- Basic+ Knowledge of MongoDB/Mongoose
- Basic+ experience with NPM
- Good experience with Discord.js
- A working connection to MongoDB with Schemas

Discord.js v13 or higher.
Nodejs v16 or higher.

Understanding Pathing

```diff
/ = Root directory.
. = This location.
.. = Up a directory.
./ = Current directory.
../ = Parent of current directory.
../../ = Two directories backwards.
```

## Get started

Lets get started by installing some dependencies, open your favourite terminal.
Run the following Commands in your Terminal.

```shell
npm install voucher-code-generator
npm install moment
npm install discord.js@latest
npm install mongoose
npm install node-cron
```

Close your terminal, we won't need it while coding.
The next steps are very easy. Create a folder called
`Models`, the path would look like this: `src/Models`.
In there, create a file called `code.js`.

We now want Mongoose to store the Data we generate.

```js
const { Schema, model } = require("mongoose");

module.exports = model(
  "premium-codes",
  new Schema({
    code: {
      type: String,
      default: null,
    },

    // Set the expire date and time. <Day, Week, Month, Year>
    expiresAt: {
      type: Number,
      default: null,
    },

    // Set the plan <Day, Week, Month>.
    plan: {
      type: String,
      default: null,
    },
  })
);
```

Great. Now we want to do the same for our Users/Members.
Create a file called `User.js` in the same Folder.
The path would look like this: `src/Models/User.js`

```js
const { Schema, model } = require("mongoose");

module.exports = model(
  "premium-user",
  new Schema({
    Id: {
      type: String,
      required: true,
      unique: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premium: {
      redeemedBy: {
        type: Array,
        default: null,
      },

      redeemedAt: {
        type: Number,
        default: null,
      },

      expiresAt: {
        type: Number,
        default: null,
      },

      plan: {
        type: String,
        default: null,
      },
    },
  })
);
```

Cool.
The next step is creating a code generator and a command to redeem them.
Let's start with generating a premium code for our users.
Go ahead and create a file called `generate.js` within your commands folder.
The path would look something like this: `src/commands/subfolder/generate.js`

```js
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
    if (message.author.id !== "Owner_ID") return;
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
```

Perfect. Now our Bot is generating the Codes.
We now want to redeem it and save it under our Profile Settings in the Database.

Go ahead and create a file within your `commands` folder called `redeem.js`
The path would look like this: `src/commands/subfolder/redeem.js`

```js
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
```

if you want to make premium users list command follow this code

```js
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
    if (message.author.id !== "Owner_ID") return;

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
```

if you want to remove a user from premium list follow this code

```js
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
    if (message.author.id !== "Owner_ID") return;
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
```

Perfect. But as you can see, we have a Collection called `userSettings` within our Code.
Lets add it real quick to our Project before we are trying out our new Commands.

Go into your main file `index.js` / `main.js` / `app.js` ..
In there, define `client` with the neccessary intents.
Once done, add the following line into your code. \*_It should be below the client defination!!_

```js
client.userSettings = new Collection();
```

**OPTIONAL**
The next step requires some working brain, try understanding it first before trying it.
Go into your `interactionCreate.js` file. Define our Schema `User` and add it into the `command`.
You can also use your own and just integrate the User into it.
It's necessary so the bot can separate premium users of normal users.

```js
// Check the guide at the beginning if you don't understand paths.
const client = require("../index");
const User = require("../Models/User");

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  let prefix = "!";
  let args = message.content.slice(prefix.length).trim().split(/ +/);
  let cmd = args.shift()?.toLowerCase();
  const command = client.mcommands.get(cmd);
  if (!command) return;
  if (command) {
    let user = client.userSettings.get(message.author.id);
    // If there is no user, create it in the Database as "newUser"
    if (!user) {
      const findUser = await User.findOne({ Id: message.author.id });
      if (!findUser) {
        const newUser = await User.create({ Id: message.author.id });
        client.userSettings.set(message.author.id, newUser);
        user = newUser;
      } else return;
    }
    if (command.premium && user && !user.isPremium) {
      return message.reply({
        content: `> \`${message.author.username}\` You are Not Premium User`,
      });
    } else {
      command.run(client, message, args, prefix);
    }
  }
});
```

Awesome. We now want the Bot define the User once going online.
Go into your `ready.js` event. It's where the Bot is booting up.

```js
const client = require("../index");
const User = require("../Models/User");

client.on("ready", async () => {
  console.log(`bot is ready for work !!`);
  // premium system loader
  const users = await User.find();
  users.forEach((user) => client.userSettings.set(user.Id, user));
});
```

Awesome. We are one step away!
You might have seen a handler called `premium` in the last code snippet, let's work that out.

Your bot has at least one handler called `command.js` right?
(`events` is also possible).
Go ahead and create a file called `premium.js` within the `handlers` folder.
The path may look like this: `src/handlers/premium.js`

```js
const User = require("../Models/User");
const cron = require("node-cron");

// set the schedule, find the user in the database.
module.exports = async (client) => {
  console.log(`> Premium System Loaded !!`);
  cron.schedule("*/60 * * * * *", async () => {
    const users = await User.find({ isPremium: true });
    if (!users?.length) return;
    users?.forEach(async (user) => {
      if (Date.now() >= user.premium.expiresAt) {
        // Default: The user is not a premium User
        user.isPremium = false;
        user.premium.redeemedBy = [];
        user.premium.redeemedAt = null;
        user.premium.expiresAt = null;
        user.premium.plan = null;
        // Save the updated user within the usersSettings.
        const newUser = await user.save({ new: true }).catch(() => {});
        client.usersSettings.set(newUser.Id, newUser);
      }
    });
  });
};
```

AAAAND BOOM. We are done. You have successfully setup your own Premium System for your Discord Bot.
Go ahead and start your Bot. Once online, run `/gencode daily`.

<p align="center">
  <a href="https://discord.gg/PcUVWApWN3" target="blank"><img src="https://media.discordapp.net/attachments/1007230019371802654/1063090222251913276/gencode.png" alt="Generate Code" /></a>
</p>

This will create a premium code that expires in exactly 24hours.
Redeem the Code with `/redeem <code>`. :)

<p align="center">
  <a href="https://discord.gg/PcUVWApWN3" target="blank"><img src="https://media.discordapp.net/attachments/1007230019371802654/1063090223086579762/redeem.png" alt="Redeem Code" /></a>
</p>

You might wonder, how you can strict a command down to only premium Users.
I will show you one example, it's very easy.

```js
const { Message, PermissionFlagsBits, Client } = require("discord.js");

module.exports = {
  name: "ping",
  description: "Get Bot Real Ping !!",
  userPermissions: PermissionFlagsBits.SendMessages,
  botPermissions: PermissionFlagsBits.SendMessages,
  category: "Misc",
  cooldown: 5,
  premium: true, // true if you want to make command premium
  /**
   *
   * @param {Client} client
   * @param {Message} message
   * @param {String[]} args
   * @param {String} prefix
   */
  run: async (client, message, args, prefix) => {
    // Code
    message.reply({
      content: `> Pong \`${client.ws.ping}\``,
    });
  },
};
```

Congrats. You now have a fully working premium system integrated.

Hopefully it helped you to make your bot a little bit better :)
