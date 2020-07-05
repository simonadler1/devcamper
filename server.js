const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");
// Load env vars
dotenv.config({ path: "./config/config.env" });

//Connect to database
connectDB();

// Route Files

const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");

const app = express();

// body parser
app.use(express.json());

// dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//Mount routers

app.use("/api/V1/bootcamps", bootcamps);
app.use("/api/V1/courses", courses);

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
