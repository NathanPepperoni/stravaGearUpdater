const print = (toPrint) => {
  if (typeof toPrint === "string") {
    console.log(toPrint);
  } else {
    console.log(JSON.stringify(toPrint));
  }
};

const sleep = async (sleepSeconds) => {
  return new Promise((resolve) => setTimeout(resolve, sleepSeconds * 1000));
};

const getArgs = () => {
  let aesKey;
  let refreshToken;
  let clientId;
  let clientSecret;
  let dateLimit;
  process.argv.forEach((arg) => {
    const argString = arg.toLowerCase();
    if (argString.includes("--refreshtoken=")) {
      refreshToken = argString.replace("--refreshtoken=", "");
    }
    if (argString.includes("--datelimit=")) {
      dateLimit = argString.replace("--datelimit=", "");
    }
  });

  return {
    aesKey: aesKey,
    clientId: clientId,
    clientSecret: clientSecret,
    refreshToken: refreshToken,
    dateLimit: dateLimit,
  };
};

module.exports = {
  print,
  sleep,
  getArgs,
};
