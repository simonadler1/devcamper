const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
// const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");

// Load env vars
dotenv.config({ path: "./config/config.env" });

//Connect to database
connectDB();

// Route Files

const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const auth = require("./routes/auth");

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

//set static folder
app.use(express.static(path.join(__dirname, "public")));

//Mount routers

app.use("/api/V1/bootcamps", bootcamps);
app.use("/api/V1/courses", courses);
app.use("/api/v1/auth", auth);

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
