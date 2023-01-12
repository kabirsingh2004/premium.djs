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
