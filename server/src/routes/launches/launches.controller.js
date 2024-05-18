const {
  getAllLaunches,
  scheduleNewLaunch,
  existLaunchWithId,
  abortLaunchById
} = require('../../models/launches.model');
const { getPagination } = require('../../services/query');

async function httpGetAllLaunches(req, res) {
  const { skip, limit } = getPagination(req.query);
  const launches = await getAllLaunches(skip, limit)
  return res.status(200).json(launches);
};

async function httpAddNewLaunch(req, res) {
  const launch = req.body;

  if(!launch.mission || !launch.rocket || !launch.launchDate || !launch.target) {
    return res.status(400).json({
      error: "Missing required launch property"
    });
  }

  launch.launchDate = new Date(launch.launchDate);

  // new Date object convert the date as a unix time stamp number
  if(isNaN(launch.launchDate)) {
    return res.status(400).json({
      error: "Invalid launch date"
    });
  }
  
  await scheduleNewLaunch(launch);
  return res.status(201).json(launch);
};

async function httpAbortLaunch(req, res) {
  // parm is a string "/launches/paramNumber"but the number in the data object is a number
  // so it need to be converted to a number
  const launchId = Number(req.params.id);
  const existLaunch = await existLaunchWithId(launchId)
  // if launch not exist
  if(!existLaunch) {
    return res.status(400).json({
      error: "Launch not found"
    });
  }

  const aborted = await abortLaunchById(launchId);

  if (!aborted) {
    return res.status(400).json({
      error: "Launch not aborted"
    });
  }
  
  // if launch exist
  return res.status(200).json({
    ok: true,
  });
}

module.exports = {
  httpGetAllLaunches,
  httpAddNewLaunch,
  httpAbortLaunch,
};