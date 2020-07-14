const path = require("path");
const ErrorResponse = require("../util/errorResponse.js");
const asyncHandler = require("../middleware/async");
const geocoder = require("../util/geocoder");
const Bootcamp = require("../models/Bootcamp");

// @desc get all bootcamps
// @route GET /api/v1/bootcamps
// @access Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});
// @desc get single bootcamp
// @route GET /api/v1/bootcamp
// @access Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`)
    );
  }
  res.status(200).json({ success: true, data: bootcamp });
});
// @desc post create new bootcamp
// @route POST /api/v1/bootcamp
// @access Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  // add user to req.body
  req.body.user = req.user.id;

  // check for published bootcamp
  const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

  // if the user is not an admin, they can only add one bootcamp
  if (publishedBootcamp && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `user with id ${req.user.id} has already published a bootcamp`,
        400
      )
    );
  }

  const bootcamp = await Bootcamp.create(req.body);

  res.status(201).json({ successs: true, data: bootcamp });
});
// @desc post update bootcamp
// @route POST /api/v1/bootcamp/:id
// @access Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`)
    );
  }
  // confirm user is bootcamp owner

  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `user ${req.params.id} is not authorized to update this bootcamp`
      )
    );
  }
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
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`)
    );
  }

  //make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `user ${req.params.id} is not authorized to deletes this bootcamp`
      )
    );
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

// @desc upload photo for bootcamp
// @route PUT /api/v1/bootcamp/:id/photo
// @access Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  //make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `user ${req.params.id} is not authorized to update this bootcamp`
      )
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`please upload a file`, 400));
  }

  const file = req.files.file;

  // make sure image is a photo

  if (!file.mimetype.startWith("image")) {
    return next(new ErrorResponse(`please upload an image file`, 400));
  }

  // check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `please upload an image file less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  // create custom filename
  file.name = `photo_${bootcamp._id}${path.parse(file.name.ext)}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`problem with file upload`, 500));
    }
    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
    res.status(200).json({
      success: true,
      data: file.name,
    });
  });
});
