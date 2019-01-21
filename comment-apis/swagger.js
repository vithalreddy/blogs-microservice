/* eslint-disable */

const swaggerJSDoc = require("swagger-jsdoc");
const { writeFileSync, unlinkSync } = require("fs");
const app = require("express")();
const swaggerUi = require("swagger-ui-express");
const opener = require("opener");

const options = {
  definition: {
    info: {
      title: "Blog Microservice APIS",
      version: "1.0.0",
      description: "All The APIs Related Blog CRUD Ops"
    },
    host: "localhost:9000",
    basePath: "/api/v1"
  },
  apis: ["./app/controllers/*.controller.js"]
};

const swaggerSpec = swaggerJSDoc(options);

app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.listen(9001, () => {
  const url = "http://localhost:9001";
  console.info("Docs Server Running @ " + url);
  opener(url);
});
