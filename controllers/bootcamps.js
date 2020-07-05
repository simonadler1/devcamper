const ErrorResponse = require("../util/errorResponse.js");
const asyncHandler = require("../middleware/async");
const geocoder = require("../util/geocoder");
const Bootcamp = require("../models/Bootcamp");

// @desc get all bootcamps
// @route GET /api/v1/bootcamps
// @access Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  let query;
  //copy req.query
  const reqQuery = { ...req.query };

  //fields to exclude
  const removeFields = ["select", "sort", "page", "limit"];

  //loop over removefields and delete from req query
  removeFields.forEach((param) => delete reqQuery[param]);
  //create query string
  let queryStr = JSON.stringify(reqQuery);

  //create operators
  queryStr = queryStr.replace(/\b(gt|gte|lte|in)\b/g, (match) => `$${match}`);
  //finding resource
  query = Bootcamp.find(JSON.parse(queryStr)).populate("courses");
  // select fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }
  //sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }
  //pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Bootcamp.countDocuments();

  query.skip(startIndex).limit(limit);
  // executing query
  const bootcamps = await query;

  //pagination result
  const pagination = {};
  if (endIndex < total) {
    pagination.next = { page: page + 1, limit };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }
  res.status(200).json({
    success: true,
    count: bootcamps.length,
    pagination,
    data: bootcamps,
  });
});
// @desc get single bootcamp
// @route GET /api/v1/bootcamp
// @access Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(err);
  }
  res.status(200).json({ success: true, data: bootcamp });
});
// @desc post create new bootcamp
// @route POST /api/v1/bootcamp
// @access Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.create(req.body);
  res.status(201).json({ successs: true, data: bootcamp });
});
// @desc post update bootcamp
// @route POST /api/v1/bootcamp/:id
// @access Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: bootcamp });
});
// @desc delete delete bootcamp
// @route DELETE /api/v1/bootcamp/:id
// @access Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(err);
  }

  bootcamp.remove();

  res.status(200).json({ success: true, data: {} });
});
// @desc get bootcamps within a radius
// @route Get /api/v1/bootcamp/radius/:zipcode/:distance
// @access Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  //get lat/lng from geocode
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  //calc radius using radians
  //divide distance by radius of earth
  // earth radius 3963 miles
  const radius = distance / 3963;
  const bootcamps = await Bootcamp.find({
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  });
  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  });
});
