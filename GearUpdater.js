const { StravaDAL } = require("./stravaDAL.js");
const Storage = require("./Storage.js");
const utils = require("./utils.js");

const LAST_KNOWN_ID_KEY = "lastKnownID";

/**
 * The epoch time of the day you want the script to stop. The script won't process activities from before this datetime.
 */
const dateBackup = 1706338800000;

class GearUpdater {
  constructor(gearConfig, lastKnownID, refreshToken, tokenExpiration) {
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
      try {
        payloadActivities = await this.stravaDAL.listActivities(page++, 10);
      } catch (error) {
        utils.print(error);
      }
      for (let i = 0; i < payloadActivities.length; i++) {
        if (Date.parse(payloadActivities[i].start_date) <= dateBackup) {
          throw new Error(
            "Backup date reached. Please check the last known id in storage."
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
    console.log(`Processing activity ${activityId}...`);
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
