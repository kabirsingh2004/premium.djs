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
