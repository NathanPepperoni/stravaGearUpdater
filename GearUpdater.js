const { StravaDAL } = require("./stravaDAL.js");
const Storage = require("./Storage.js");
const utils = require("./utils.js");

const LAST_KNOWN_ID_KEY = "lastKnownID";

class GearUpdater {
  constructor(gearConfig, lastKnownID, refreshToken, tokenExpiration) {
    this.dateLimit = Number.parseInt(utils.getArgs().dateLimit) ?? 0;
    this.gearConfig = gearConfig;
    this.storage = new Storage();
    this.stravaDAL = new StravaDAL(refreshToken, tokenExpiration);
    this.lastKnownID = lastKnownID;
  }

  async fetchActivitiesToUpdate() {
    let activities = [];
    let payloadActivities = [];
    let caughtUp = false;
    let page = 1;
    this.lastKnownID = await this.storage.getKey(LAST_KNOWN_ID_KEY);
    do {
      payloadActivities = await this.stravaDAL.listActivities(page++, 10);
      for (let i = 0; i < payloadActivities.length; i++) {
        if (Date.parse(payloadActivities[i].start_date) <= this.dateLimit) {
          throw new Error(
            "Backup date reached. Please check the lastKnownID in storage.json."
          );
        }
        if (payloadActivities[i].id === this.lastKnownID) {
          caughtUp = true;
          break;
        }
        activities.push(payloadActivities[i]);
      }
    } while (payloadActivities.length > 0 && !caughtUp);

    return activities.reverse();
  }

  async processActivity(activityId) {
    utils.print(`Processing activity ${activityId}...`);
    const activity = await this.stravaDAL.getActivity(activityId);

    if (activityId > this.lastKnownID) {
      await this.storage.updateKey(LAST_KNOWN_ID_KEY, activityId);
    }

    for (let i = 0; i < this.gearConfig.length; i++) {
      if (
        activity.device_name === this.gearConfig[i].deviceName &&
        activity.gear_id !== this.gearConfig[i].gearId
      ) {
        await this.stravaDAL.updateGearOnActivity(
          activity,
          this.gearConfig[i].gearId
        );
        return;
      }
    }
  }
}

module.exports = { GearUpdater, LAST_KNOWN_ID_KEY };
