const fs = require("fs");
const { GearUpdater, LAST_KNOWN_ID_KEY } = require("./GearUpdater.js");
const { TOKEN_EXPIRATION_KEY, StravaDAL } = require("./stravaDAL.js");
const Storage = require("./Storage.js");
const utils = require("./utils.js");

const POLL_RATE = 60000;

const checkArgs = () => {
  const args = utils.getArgs();
  const missingArgs = [];
  if (!args.clientId) {
    missingArgs.push("--clientId");
  }
  if (!args.clientSecret) {
    missingArgs.push("--clientSecret");
  }
  if (!args.aesKey) {
    missingArgs.push("--aesKey");
  }

  if (missingArgs.length > 0) {
    utils.print("Missing the following required arguments:");
    for (let i = 0; i < missingArgs.length; i++) {
      utils.print(`    ${missingArgs[i]}`);
    }
    return false;
  }

  return true;
};

const execute = async () => {
  if (!checkArgs()) {
    return 1;
  }

  const gearConfig = JSON.parse(
    fs.readFileSync("./gear.config", {
      encoding: "utf8",
      flag: "r",
    })
  );

  if (Object.keys(gearConfig).length === 0) {
    throw new Error(
      "No device mapping was found. Please check the gear.config file."
    );
  }

  const storage = new Storage();
  const lastKnownID = await storage.getKey(LAST_KNOWN_ID_KEY);
  const refreshToken =
    (await storage.retrieveRefreshToken()) || utils.getArgs().refreshToken;
  if (!refreshToken) {
    throw new Error(
      "No refresh token found. If this is the first execution, please provide the latest refresh token via the -refreshToken flag."
    );
  }
  const tokenExpiration = await storage.getKey(TOKEN_EXPIRATION_KEY);

  const gearUpdater = new GearUpdater(
    gearConfig,
    lastKnownID,
    refreshToken,
    tokenExpiration
  );

  utils.print("listening for new activities...");
  setInterval(async () => {
    const newActivities = await gearUpdater.fetchActivitiesToUpdate();

    if (newActivities.length === 0) {
      return;
    }

    utils.print(
      `New ${
        newActivities.length > 1 ? "activities" : "activity"
      } found! processing...`
    );

    for (const activity of newActivities) {
      await gearUpdater.processActivity(activity.id);
    }

    utils.print(
      `${newActivities.length > 1 ? "Activities" : "Activity"} processed!`
    );
    utils.print("listening for new activities...");
  }, POLL_RATE);
};

execute();
