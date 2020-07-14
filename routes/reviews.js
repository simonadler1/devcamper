const express = require("express");

const Review = require("../models/Review");

const {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview,
  //   deleteCourse,
} = require("../controllers/reviews");

const router = express.Router({ mergeParams: true });

//middleware
const advancedResults = require("../middleware/advancedResults");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .get(
    advancedResults(Review, {
      path: "bootcamp",
      select: "name description",
    }),
    getReviews
  )
  .post(protect, authorize("user", "admin"), addReview);
// .post(addReview);
//   .post(protect, authorize("publisher", "admin"), addCourse);
router
  .route("/:id")
  .get(getReview)
  .put(protect, authorize("user", "admin"), updateReview)
  .delete(protect, authorize("user", "admin"), deleteReview);
//   .put(protect, authorize("publisher", "admin"), updateCourse)
//   .delete(protect, authorize("publisher", "admin"), deleteCourse);

module.exports = router;
