const path = require("path");
const fs = require("fs");

fs.readdirSync(path.join(__dirname, "./")).forEach(file => {
  if (file.match(/\.js$/) !== null && file !== "index.js") {
    module.exports[file.split(".")[0]] = require(`./${file}`);
  }
});
