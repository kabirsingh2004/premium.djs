<p align="center">
  <a href="https://discord.gg/3eNaWPhWZE" target="blank"><img src="https://cdn.discordapp.com/attachments/881491251784978452/925487363017277510/djs.png" width="200" height="200" alt="Djs" /></a>
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

```
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
const mongoose = require("mongoose");

// Generate Premium Code
const premiumCode = mongoose.Schema({
  code: {
    type: mongoose.SchemaTypes.String,
    default: null,
  },

  // Set the expire date and time. <Day, Week, Month, Year>
  expiresAt: {
    type: mongoose.SchemaTypes.Number,
    default: null,
  },

  // Set the plan <Day, Week, Month>.
  plan: {
    type: mongoose.SchemaTypes.String,
    default: null,
  },
});

module.exports = mongoose.model("premium-codes", premiumCode);
```

Great. Now we want to do the same for our Users/Members.
Create a file called `User.js` in the same Folder.
The path would look like this: `src/Models/User.js`

```js
const mongoose = require("mongoose");

// The heart of the User, here is everything saved that the User does.
// Such as Levels, Courses, Premium, Enrolled, XP, Leaderboard.
const user = mongoose.Schema({
  Id: {
    type: mongoose.SchemaTypes.String,
    required: true,
    unique: true,
  },
  isPremium: {
    type: mongoose.SchemaTypes.Boolean,
    default: false,
  },
  premium: {
    redeemedBy: {
      type: mongoose.SchemaTypes.Array,
      default: null,
    },

    redeemedAt: {
      type: mongoose.SchemaTypes.Number,
      default: null,
    },

    expiresAt: {
      type: mongoose.SchemaTypes.Number,
      default: null,
    },

    plan: {
      type: mongoose.SchemaTypes.String,
      default: null,
    },
  },
});
module.exports = mongoose.model("user", user);
```

Cool.
The next step is creating a code generator and a command to redeem them.
Let's start with generating a premium code for our users.
Go ahead and create a file called `generate.js` within your commands folder.
The path would look something like this: `src/commands/subfolder/generate.js`

```js
const { Command } = require("reconlx");
const ee = require("../../settings/embed.json");
const config = require("../../settings/config.json");
const moment = require("moment");
const voucher_codes = require("voucher-code-generator");
const schema = require("../../Models/code");

module.exports = new Command({
  // options
  name: "gencode",
  description: `gen premium codes`,
  userPermissions: [],
  category: "Premium",
  options: [
    {
      name: "plan",
      description: `choose your plan`,
      type: "STRING",
      required: true,
      choices: [
        {
          name: "daily",
          value: "daily",
        },
        {
          name: "weekly",
          value: "weekly",
        },
        {
          name: "monthly",
          value: "monthly",
        },
        {
          name: "yearly",
          value: "yearly",
        },
      ],
    },
    {
      name: "amount",
      description: `amount of codes`,
      type: "NUMBER",
      required: false,
    },
  ],
  // command start
  run: async ({ client, interaction, args }) => {
    // Code
    // As defined in the Schema, leave codes as an empty array variable
    let codes = [];

    // Display available plans of the code
    const plan = interaction.options.getString("plan");

    // Calculate time for the code to expire.
    let time;
    if (plan === "daily") time = Date.now() + 86400000;
    if (plan === "weekly") time = Date.now() + 86400000 * 7;
    if (plan === "monthly") time = Date.now() + 86400000 * 30;
    if (plan === "yearly") time = Date.now() + 86400000 * 365;

    // If the input is for ex. 10, generate 10 Codes. Default => 1 Code / Command.
    let amount = interaction.options.getNumber("amount");
    if (!amount) amount = 1;

    for (var i = 0; i < amount; i++) {
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

    // Lastly, we want to send the new Code(s) into the Channel.
    interaction.followUp({
      content: `\`\`\`Generated +${codes.length}\n\n--------\n${codes.join(
        "\n"
      )}\n--------\n\nType - ${plan}\nExpires - ${moment(time).format(
        "dddd, MMMM Do YYYY"
      )}\`\`\`\nTo redeem, use \`/redeem <code>\``,
    });
  },
});
```

Perfect. Now our Bot is generating the Codes.
We now want to redeem it and save it under our Profile Settings in the Database.

Go ahead and create a file within your `commands` folder called `redeem.js`
The path would look like this: `src/commands/subfolder/redeem.js`

```js
const { Command } = require("reconlx");
const ee = require("../../settings/embed.json");
const config = require("../../settings/config.json");
const moment = require("moment");
const schema = require("../../Models/code");
const User = require("../../Models/User");

module.exports = new Command({
  // options
  name: "redeem",
  description: `redeem preium code`,
  userPermissions: [],
  category: "Premium",
  options: [
    {
      name: "code",
      description: `give me code`,
      type: "STRING",
      required: true,
    },
  ],
  // command start
  run: async ({ client, interaction, args }) => {
    // Code
    // Check if the user with a unique ID is in our database.
    let user = await User.findOne({
      Id: interaction.user.id, // if you are using slash commands, swap message with interaction.
    });

    // Check Users input for a valid code. Like `!redeem ABCD-EFGH-IJKL`
    let code = interaction.options.getString("code");

    // Return an error if the User does not include any Premium Code
    if (!code) {
      interaction.followUp(`**Please specify the code you want to redeem!**`);
    }

    // If the user is already a premium user, we dont want to save that so we return it.
    if (user && user.isPremium) {
      return interaction.followUp(`**> You already are a premium user**`);
    }

    // Check if the code is valid within the database
    const premium = await schema.findOne({
      code: code.toUpperCase(),
    });

    // Set the expire date for the premium code
    if (premium) {
      const expires = moment(premium.expiresAt).format(
        "dddd, MMMM Do YYYY HH:mm:ss"
      );

      // Once the code is expired, we delete it from the database and from the users profile
      user.isPremium = true;
      user.premium.redeemedBy.push(interaction.user);
      user.premium.redeemedAt = Date.now();
      user.premium.expiresAt = premium.expiresAt;
      user.premium.plan = premium.plan;

      // Save the User within the Database
      user = await user.save({ new: true }).catch(() => {});
      client.userSettings.set(interaction.user.id, user);
      await premium.deleteOne().catch(() => {});

      // Send a success message once redeemed
      interaction.followUp(
        `**You have successfully redeemed premium!**\n\n\`Expires at: ${expires}\``
      );

      // Error message if the code is not valid.
    } else {
      return interaction.followUp(
        `**The code is invalid. Please try again using valid one!**`
      );
    }
  },
});
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
const User = require("../Models/User");
const cmd = client.Commands.get(interaction.commandName);
if (cmd) {
  let user = client.userSettings.get(interaction.user.id);
  // If there is no user, create it in the Database as "newUser"
  if (!user) {
    const findUser = await User.findOne({ Id: interaction.user.id });
    if (!findUser) {
      const newUser = await User.create({ Id: interaction.user.id });
      client.userSettings.set(interaction.user.id, newUser);
      user = newUser;
    } else return;
  }

  if (cmd.premium && user && !user.isPremium) {
    interaction.followUp(`You are not premium user`);
  } else {
    cmd.run({ client, interaction, args });
  }
}
```

Awesome. We now want the Bot define the User once going online.
Go into your `ready.js` event. It's where the Bot is booting up.

```js
const client = require("..");
const User = require("../Models/User");

client.on("ready", async () => {
  console.log(`${client.user.username} Is Online`);
  client.user.setActivity({
    name: `KABIR CODING ME RIGHT NOW`,
    type: "WATCHING",
  });

  // codde
  const users = await User.find();
  for (let user of users) {
    client.userSettings.set(user.Id, user);
  }
});
```

Awesome. We are one step away!
You might have seen a handler called `premium` in the last code snippet, let's work that out.

Your bot has at least one handler called `command.js` right?
(`events` is also possible).
Go ahead and create a file called `premium.js` within the `handlers` folder.
The path may look like this: `src/handlers/premium.js`

```js
// Define the User from our Database Schema
const User = require("../Models/User");
const cron = require("node-cron");

// set the schedule, find the user in the database.
module.exports = async (client) => {
  cron.schedule("*/60 * * * * *", async () => {
    await User.find({ isPremium: true }, async (err, users) => {
      if (users && users.length) {
        // Set the expire Date and Time for our User + Code
        for (let user of users) {
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
        }
      }
    });
  });
};
```

AAAAND BOOM. We are done. You have successfully setup your own Premium System for your Discord Bot.
Go ahead and start your Bot. Once online, run `/gencode daily`.

<p align="center">
  <a href="https://discord.gg/3eNaWPhWZE" target="blank"><img src="https://media.discordapp.net/attachments/877230407114973264/925504074181402624/unknown.png" width="700" height="300" alt="Generate Code" /></a>
</p>

This will create a premium code that expires in exactly 24hours.
Redeem the Code with `/redeem <code>`. :)

<p align="center">
  <a href="https://discord.gg/3eNaWPhWZE" target="blank"><img src="https://cdn.discordapp.com/attachments/877230407114973264/925505093049147442/unknown.png" width="700" height="300" alt="Redeem Code" /></a>
</p>

You might wonder, how you can strict a command down to only premium Users.
I will show you one example, it's very easy.

```js
const { Command } = require("reconlx");
const { MessageEmbed } = require("discord.js");
const ee = require("../../settings/embed.json");
const config = require("../../settings/config.json");

module.exports = new Command({
  // options
  name: "ping",
  description: `Show Bot Ping`,
  userPermissions: ["SEND_MESSAGES"],
  category: "Information",
  premium: true,
  // command start
  run: async ({ client, interaction, args }) => {
    interaction.followUp({
      embeds: [new MessageEmbed().setTitle(`Ping :- ${client.ws.ping}`)],
    });
  },
});

```

Congrats. You now have a fully working premium system integrated.

Hopefully it helped you to make your bot a little bit better :)
