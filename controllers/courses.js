const ErrorResponse = require("../util/errorResponse.js");
const asyncHandler = require("../middleware/async");
const Course = require("../models/Course");
const Bootcamp = require("../models/Bootcamp");

// @desc get courses
// @route GET /api/v1/courses
// @route GET /api/v1/bootcamps/:bootcampsId/courses
// @access Public
exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId });
    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});
// @desc get single course
// @route GET /api/v1/courses/:id
// @access Public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await (await Course.findById(req.params.id)).populated({
    path: "bootcamp",
    select: "name description",
  });
  if (!course) {
    return (
      next(new ErrorResponse(`no course with id of ${req.params.id}`)), 404
    );
  }

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses,
  });
});
// @desc add course
// @route POST /api/v1/bootcamps/:bootcampId/courses
// @access Private
exports.addCourse = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;

  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return (
      next(new ErrorResponse(`no bootcamp with id of ${req.params.id}`)), 404
    );
  }
  //make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `user ${req.user.id} is not authorized to add a course to bootcamp ${bootcamp._id}`
      )
    );
  }

  const course = await Course.create(req.body);

  res.status(200).json({
    success: true,

    data: course,
  });
});
// @desc update course
// @route PUT /api/v1/courses/:id
// @access Private
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);
  if (!course) {
    return (
      next(new ErrorResponse(`no course with id of ${req.params.id}`)), 404
    );
  }

  //make sure user is bootcamp owner
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `user ${req.user.id} is not authorised to update bootcamp ${bootcamp._id}`
      )
    );
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,

    data: course,
  });
});
// @desc delete course
// @route DELETE /api/v1/courses/:id
// @access Private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return (
      next(new ErrorResponse(`no course with id of ${req.params.id}`)), 404
    );
  }

  //make sure user is bootcamp owner
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `user ${req.user.id} is not authorised to delete bootcamp ${bootcamp._id}`
      )
    );
  }

  await course.remove();

  res.status(200).json({
    success: true,

    data: course,
  });
});
