const axios = require('axios');

const launchesDB = require('./launches.mongo')
const planets = require('./planets.mongo')

const DEFAULT_FLIGHT_NUMBER = 100;

//load launches data from spaceX history launches
const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches() {
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1
          }
        },
        {
          path: "payloads",
          select: {
            customers: 1
          }
        }
      ]
    }
  });

  if(response.status !== 200) {
    console.log('Problem downloading launch data');
    throw new Error('Launch data download failed');
  }

  const launchDocs = response.data.docs;

  for (const launchDoc of launchDocs) {
    const payloads = launchDoc['payloads'];
    const customerss = payloads.flatMap((payload) => {
      return payload['customers'];
    });

    const launch = {
      flightNumber: launchDoc['flight_number'],
      mission: launchDoc['name'],
      rocket: launchDoc['rocket']['name'],
      launchDate: launchDoc['date_local'],
      customers: customerss, //payload.customers in spaceX query api
      upcoming: launchDoc['upcoming'],
      success: launchDoc['success'],
    };

    await saveLaunch(launch);
  }
};

async function loadLaunchesData() {

  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat"
  });

  if (firstLaunch) {
    console.log('launch data already loaded...');
  } else {
    console.log('download launches data...');
    await populateLaunches();
  }

};

async function findLaunch(filter) {
  return await launchesDB.findOne(filter);
};

async function existLaunchWithId(launchId) {
  return await findLaunch({
    flightNumber: launchId,
  });
};

async function getLatestFlightNumber() {
  const latestLaunch =  await launchesDB.findOne().sort('-flightNumber');

  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }

  return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
  return await launchesDB.find({}, {
    "_id": 0,
    "__v": 0
  })
  .sort({flightNumber: 1})
  .skip(skip)
  .limit(limit);
  // skip and limit will return db data paginated 
}

async function saveLaunch(launch) {

  await launchesDB.findOneAndUpdate({
    flightNumber: launch.flightNumber,
  }, launch, {
    upsert: true,
  });

}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });

  // validate planet is one of the planets from the planets select list sered in DB
  if(!planet) {
    throw new Error ('No Matching planet found');
  }

  const newFlightNumber = await getLatestFlightNumber() + 1;

  const newLaunch = Object.assign(launch, {
      flightNumber: newFlightNumber,
      customers: ['ZIBI', 'NASA'],
      upcoming: true,
      success: true,
  });
 
  await saveLaunch(newLaunch);
}

async function abortLaunchById(launchId) {
  const aborted =  await launchesDB.updateOne({
    flightNumber: launchId,
  }, {
    upcoming: false,
    success: false,
  });

  return aborted.modifiedCount === 1;
};

module.exports = {
  loadLaunchesData,
  getAllLaunches,
  scheduleNewLaunch,
  existLaunchWithId,
  abortLaunchById,
};