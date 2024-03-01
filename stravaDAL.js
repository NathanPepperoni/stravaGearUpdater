const strava = require("strava-v3");
const Storage = require("./Storage.js");

const TOKEN_EXPIRATION_KEY = "tokenExpiration";

class StravaDAL {
  constructor(refreshToken, tokenExpiration) {
    this.storage = new Storage();
    this.accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiration = tokenExpiration;
    this.clientId = process.env.STRAVA_CLIENT_ID;
    this.clientSecret = process.env.STRAVA_CLIENT_SECRET;
    strava.config({
      access_token: this.accessToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: "nan",
    });
    this.stravaClient = new strava.client(this.accessToken);
  }

  async updateGearOnActivity(activity, gearId) {
    const client = await this.getLatestStravaClient();
    await client.activities.update({
      id: activity.id,
      gear_id: gearId,
    });
    await this.storage.logUpdate(activity.id, activity.gear_id, gearId);
  }

  async listActivities(page, perPage) {
    const client = await this.getLatestStravaClient();
    return await client.athlete.listActivities({
      page: page,
      per_page: perPage,
    });
  }

  async getActivity(activityId) {
    const client = await this.getLatestStravaClient();
    return await client.activities.get({ id: activityId });
  }

  async getLatestStravaClient() {
    const tokenHasExpired =
      !this.tokenExpiration || Date.now() / 1000 >= this.tokenExpiration;
    if (!this.accessToken || tokenHasExpired) {
      const refreshResponse = await strava.oauth.refreshToken(
        this.refreshToken
      );
      this.accessToken = refreshResponse.access_token;
      this.refreshToken = refreshResponse.refresh_token;
      this.tokenExpiration = refreshResponse.expires_at;
      this.storage.securelyStoreRefreshToken(this.refreshToken);
      this.storage.updateKey(TOKEN_EXPIRATION_KEY, this.tokenExpiration);

      strava.config({
        access_token: this.accessToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: "nan",
      });

      this.stravaClient = new strava.client(this.accessToken);
    }
    return this.stravaClient;
  }
}

module.exports = { StravaDAL, TOKEN_EXPIRATION_KEY };
