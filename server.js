const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
// const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");

// Load env vars
dotenv.config({ path: "./config/config.env" });

//Connect to database
connectDB();

// Route Files

const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const reviews = require("./routes/reviews");
const auth = require("./routes/auth");
const users = require("./routes/users");

const app = express();

// body parser
app.use(express.json());

// cookie parser
app.use(cookieParser());

// dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//file uploading !!!! file upload is disabled. causes server to hang needs to be debugged
// app.use(fileupload);

// sanitize data
app.use(mongoSanitize());

// set security headers
app.use(helmet());

// prevent xss attacks
app.use(xss());

// rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
});

app.use(limiter);

// prevent http param pollution
app.use(hpp());

// enable CORS
app.use(cors());

//set static folder
app.use(express.static(path.join(__dirname, "public")));

//Mount routers

app.use("/api/V1/bootcamps", bootcamps);
app.use("/api/V1/courses", courses);
app.use("/api/V1/reviews", reviews);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);

app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("Hello World From Shimon");
});

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  //close server and exit
  server.close(() => process.exit(1));
});
