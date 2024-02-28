# stravaGearUpdater
Automatically update the gear on activities based on device name

## How to use the strava gear updater

### cli arguments

#### --clientId
This is the client ID of your Strava API application (under stava settings, go to "My API Application")

#### --clientSecret
This is located in the same place as your client ID in strava.

#### --aesKey
This is used to encrypt the refresh token when saving it to disk. It should be cryptographically secure string sequence.

#### --refreshToken
This is only required if the application has not been run before. After the first run, the gear updater will store the refresh token automatically, as well as automatically renew and update it as the tokens expire.

### gear config
In order to configure how the updater will update activities, you must create a gear.config file in the root folder. It should look something like this:
```
[
  {
    "deviceName": "Wahoo ELEMNT BOLT",
    "gearId": "b1234"
  },
  {
    "deviceName": "Wahoo ELEMNT ROAM",
    "gearId": "b5678"
  },
]
```
In this example, the configuration is telling the app to apply the gear with id "b1234" to all activities that were recorded with a device matching "Wahoo ELEMNT BOLT", and to apply the gear with id "b5678" to all activities recorded with a device name of "Wahoo ELEMNT ROAM".

### Running the application

Once you have all the cli arguments ready, you can run the application using `npm run start`. For example: 
```
npm run start -- --clientId=yourclientid --clientSecret=yourclientsecret --aesKey=youraeskey --refreshToken=yourrefreshtoken
```

After initial launch, the app will looks for new activities every 60 seconds, and apply the rules found in the gear.config to those new activities. It will keep track of the most recent activity it's seen and use that to identify new activities, so edits to older activities will not be re-processed by the application.

