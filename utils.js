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
  process.argv.forEach((arg) => {
    const argString = arg.toLowerCase();
    if (argString.includes("--aeskey=")) {
      aesKey = argString.replace("-aeskey=", "");
    }
    if (argString.includes("--clientid=")) {
      clientId = argString.replace("--clientid=", "");
    }
    if (argString.includes("--clientsecret=")) {
      clientSecret = argString.replace("--clientsecret=", "");
    }
    if (argString.includes("--refreshtoken=")) {
      refreshToken = argString.replace("--refreshtoken=", "");
    }
  });

  return {
    aesKey: aesKey,
    clientId: clientId,
    clientSecret: clientSecret,
    refreshToken: refreshToken,
  };
};

module.exports = {
  print,
  sleep,
  getArgs,
};
