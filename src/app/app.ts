import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import passport from "passport";
import httpStatus from "http-status";
import config from "../config/config";
import morgan from "../config/morgan";
import xss from "../middlewares/xss";
import { jwtStrategy } from "../config/passport";
import { authLimiter } from "../middlewares/rateLimiter";
import routes from "../routes/v1";
import { errorConverter, errorHandler } from "../middlewares/error";
import ApiError from "../utils/ApiError";
import cookieParser from "cookie-parser";

const app = express();

if (config.env !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse cookie request
app.use(cookieParser());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());

// gzip compression
app.use(compression());

const corsOptions = {
  origin: process.env.FRONTEND_URL, // Specify the exact domain
  credentials: true, // Required for cookies to be sent and received
};
app.use(cors(corsOptions));

// enable cors
// app.use(cors());
// app.options("*", cors());

// jwt authentication
app.use(passport.initialize());
passport.use("jwt", jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === "production") {
  app.use("/v1/auth", authLimiter);
}

// v1 api routes
app.use("/v1", routes);

// default welcome route
app.get("/", (req, res) => {
  res.status(httpStatus.OK).send("Welcome to the backend API server!");
});

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
