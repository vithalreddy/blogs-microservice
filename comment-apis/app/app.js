module.exports = () => {
  const express = require("express");
  const cors = require("cors");
  const compress = require("compression");
  const helmet = require("helmet");

  const { server, apiBaseUrl } = require("../config");
  const routes = require("./routes");
  const { errorHandler } = require("./middlewares");

  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // disabling due security reasons
  app.disable("x-powered-by");

  // middleware to compress res data
  app.use(compress());

  // secure apps by setting various HTTP headers
  app.use(helmet());

  // csp header
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"]
      }
    })
  );

  app.use(
    cors({
      optionsSuccessStatus: 200
    })
  );

  app.use(apiBaseUrl, routes);

  app.use(errorHandler);

  app.listen(server.port, () => {
    console.info(`Comments Server Running on http://127.0.0.1:${server.port}.`);
  });

  return app;
};
