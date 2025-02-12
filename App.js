const fs = require("fs");
const { GearUpdater, LAST_KNOWN_ID_KEY } = require("./GearUpdater.js");
const { TOKEN_EXPIRATION_KEY, StravaDAL } = require("./stravaDAL.js");
const Storage = require("./Storage.js");
const utils = require("./utils.js");

const POLL_RATE = 180000;

const checkEnvs = (clientId, clientSecret, aesKey) => {
  const missingEnvs = [];
  if (!clientId) {
    missingEnvs.push("STRAVA_CLIENT_ID");
  }
  if (!clientSecret) {
    missingEnvs.push("STRAVA_CLIENT_SECRET");
  }
  if (!aesKey) {
    missingEnvs.push("GEAR_UPDATER_AES_KEY");
  }

  if (missingEnvs.length > 0) {
    utils.print("Missing the following required environment variables:");
    for (let i = 0; i < missingEnvs.length; i++) {
      utils.print(`    ${missingEnvs[i]}`);
    }
    return false;
  }

  return true;
};

const fetchAndProcessActivites = async (gearUpdater, stravaConnected) => {
  let newActivities = [];
  try {
    newActivities = await gearUpdater.fetchActivitiesToUpdate();
    if (!stravaConnected) {
      utils.print("Connection to Strava restored. Listening for new activities...");
    }
  } catch (error) {
    utils.print(
      `${error.message}\n\nWill try again in approximately ${Math.round(
        POLL_RATE / 60000
      )} minute(s).`
    );
    return false;
  }

  if (newActivities.length === 0) {
    return true;
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
  return true;
};

const execute = async () => {
  const appVersion = JSON.parse(fs.readFileSync("./package.json"))["version"];
  utils.print(`Strava Gear Updater v${appVersion}\n`);

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const aesKey = process.env.GEAR_UPDATER_AES_KEY;

  if (!checkEnvs(clientId, clientSecret, aesKey)) {
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
    utils.getArgs().refreshToken || (await storage.retrieveRefreshToken());
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

  let stravaConnected = false;
  stravaConnected = await fetchAndProcessActivites(gearUpdater, stravaConnected);
  setInterval(async () => {
    try {
      stravaConnected = await fetchAndProcessActivites(gearUpdater, stravaConnected);
    } catch (error) {
      const statusCodeCategory = error.message.substring(0, 1);
      if (statusCodeCategory === "5") {
        utils.print("Strava server error, will retry request.");
      } else {
        throw error;
      }
    }
  }, POLL_RATE);
};

execute();
