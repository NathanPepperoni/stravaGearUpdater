# stravaGearUpdater
Automatically update the gear on activities based on device name.

## How to use the strava gear updater

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

### cli arguments

#### --clientId
This is the client ID of your Strava API application (under stava settings, go to "My API Application")

#### --clientSecret
This is located in the same place as your client ID in strava.

#### --aesKey
This is used to encrypt the refresh token when saving it to disk. It should be cryptographically secure string sequence.

#### --dateLimit
This is use to set a time (a unix epoch time in ms) that the gear updater will never go beyond when processing files. If the program ever tries to process an activity older than this limit, it will error out and not continue to process anything, with the goal being to not mess up any strava history from before you started using devices and gear together in the way outlined in your gear.config. Optional, but highly recommended (ask my how I know).

#### --refreshToken
This is only required if the application has not been run before. After the first run, the gear updater will store the refresh token automatically, as well as automatically renew and update it as the tokens expire. The refresh token you provide should have the following scopes:
`activity:write` (to update the activities with the appropriate gear_id),`activity:read_all` (to retrieve the device_name from the activity), and `profile:read_all` (to obtain a bulk list of the users activities).

### Running the application

Once you have all the cli arguments ready, you can run the application using `npm run start`. For example: 
```
npm run start -- --clientId=yourclientid --clientSecret=yourclientsecret --aesKey=youraeskey --refreshToken=yourrefreshtoken
```

After initial launch, the app will looks for new activities every 60 seconds, and apply the rules found in the gear.config file to those new activities. It will keep track of the most recent activity it's seen and use that to identify new activities, so edits to older activities will not be re-processed by the application. For every update the updater makes, it will log that information into a csv file `updateLog.txt` with the line: `activityId,oldGearId,newGearId`. So for example, if an activity with Id `1234567890` originally had gear `b1234`, and was updated to gear `b5678` by the updater, the log file would contain the line `1234567890,b1234,b5678`. This is so that all operations done by the updater are manually reversable if the need arises. 

