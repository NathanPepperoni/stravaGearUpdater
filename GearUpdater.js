const { StravaDAL } = require("./stravaDAL.js");
const Storage = require("./Storage.js");
const utils = require("./utils.js");

const LAST_KNOWN_ID_KEY = "lastKnownID";

const DOG_WALK_GEAR_ID = "b9634768";

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
      try {
        payloadActivities = await this.stravaDAL.listActivities(page++, 10);
      } catch {
        throw new Error("Unable to connect to Strava.");
      }
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

  getExpectedGearIdForDevice(availableMetrics, deviceName) {
    const gearConfigItem = this.gearConfig.find(
      (config) => config.deviceName === deviceName
    );

    if (!gearConfigItem) {
      return undefined;
    }

    const conditionalMetrics = gearConfigItem.conditionalMetrics ?? [];

    const conditionsAreMet = !conditionalMetrics.some(
      (metric) => !availableMetrics.includes(metric)
    );

    if (conditionsAreMet) {
      return gearConfigItem.gearId;
    } else {
      return gearConfigItem.fallbackGearId;
    }
  }

  getTitleOverride(gearId, activity) {
    if (gearId !== DOG_WALK_GEAR_ID) {
      return undefined;
    }

    if (activity.average_speed < 8 && activity.distance < 10000) {
      return "🐕🚲";
    }
    return undefined;
  }

  getActivityMetrics(activity) {
    const activityMetrics = [];
    if (activity.device_watts) {
      activityMetrics.push("power");
    }
    if (activity.has_heartrate) {
      activityMetrics.push("heartrate");
    }
    return activityMetrics;
  }

  async processActivity(activityId) {
    utils.print(`Processing activity ${activityId}...`);
    const activity = await this.stravaDAL.getActivity(activityId);
    const activityMetrics = this.getActivityMetrics(activity);
    const expectedGearId = this.getExpectedGearIdForDevice(
      activityMetrics,
      activity.device_name
    );

    if (!expectedGearId) {
      utils.print(
        `Activity ${activityId} did not have a configured device name.`
      );
      return;
    }

    const titleOverride = this.getTitleOverride(expectedGearId, activity);

    if (activity.gear_id !== expectedGearId) {
      await this.stravaDAL.updateGearOnActivity(
        activity,
        expectedGearId,
        titleOverride
      );
    }

    if (activityId > this.lastKnownID) {
      await this.storage.updateKey(LAST_KNOWN_ID_KEY, activityId);
    }
  }
}

module.exports = { GearUpdater, LAST_KNOWN_ID_KEY };
