# NodeJS RESTful API Microservice Example For Blog

[![Build Status](https://secure.travis-ci.org/vithalreddy/blogs-microservice.png?branch=master)](https://travis-ci.org/vithalreddy/blogs-microservice)

Example Node.js RESTful API microservice for an Blog with unit tests, code style checking and good test coverage. The microservice exposes REST APIs which are documented using Swagger.

## Requirements

- [NodeJS](https://nodejs.org/en/download "NodeJS")
- [Postgresql](https://www.postgresql.org/download "Postgresql")

## Build for local development

You have to use the following command to start a development server:

```sh
npm install
npm run dev
```

See `package.json` for more details.

## Build for production environments

```sh
npm install --production
npm start
```

See `package.json` for more details.

## Tests

Following tests libraries are used for unit/integration tests:

Tests are kept next to source with following pattern \*.spec.js

Use following command to run tests in each micorservice directories:

```sh
npm test
```

Use following command to run tests coverage in each micorservice directories:

```sh
npm run coverage
```

Use following command to Generate and Open Documenation in Browser in each micorservice directories:

make sure microservice is running to test docs, interactively

```sh
npm run docs
```

## Docker Compose

Use following command to setup microserives and deploy:

```sh
docker-compose up -d --build
```

See `Dockerfile` in Microservice directories and `docker-compose.yml` for more details.
