const fs = require("fs");
const aes = require("crypto-js/aes.js");
const crypto = require("crypto-js");
const utils = require("./utils.js");

class Storage {
  constructor() {
    this.aesKey = process.env.GEAR_UPDATER_AES_KEY;
  }

  // TODO debounce this if Im ever worried about disk writes
  async updateKey(key, value) {
    const config = JSON.parse(fs.readFileSync("./storage.json"), {
      encoding: "utf8",
      flag: "r",
    });
    config[key] = value;
    fs.writeFileSync("./storage.json", JSON.stringify(config), {
      encoding: "utf8",
    });
  }

  async getKey(key) {
    return JSON.parse(fs.readFileSync("./storage.json"), {
      encoding: "utf8",
      flag: "r",
    })[key];
  }

  async securelyStoreRefreshToken(refreshToken) {
    const aesKey = this.aesKey;
    const ciphertext = aes.encrypt(refreshToken, aesKey).toString();
    fs.writeFileSync("./encRefreshToken", ciphertext, { encoding: "utf8" });
  }

  async retrieveRefreshToken() {
    const aesKey = this.aesKey;
    const refreshTokenExists = await fs.existsSync("./encRefreshToken");
    if (!refreshTokenExists) {
      return undefined;
    }
    const cipherString = await fs.readFileSync("./encRefreshToken", {
      encoding: "utf8",
      flag: "r",
    });

    const decryptedRefreshToken = aes
      .decrypt(cipherString, aesKey)
      .toString(crypto.enc.Utf8);

    return decryptedRefreshToken;
  }

  // TODO debounce this if Im ever worried about disk writes
  async logUpdate(activityId, oldGearID, newGearId) {
    await fs.appendFileSync(
      "./updateLog.txt",
      `${activityId},${oldGearID},${newGearId}\n`
    );
  }
}

module.exports = Storage;
