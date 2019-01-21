module.exports = (debug = true, dropDB = false) =>
  new Promise(async (resolve, reject) => {
    try {
      const { database } = require("../config");
      const Sequelize = require("sequelize");
      const { Client } = require("pg");

      global.SequelizeOP = Sequelize.Op;

      const conn = new Client({
        host: database.host,
        database: "postgres",
        user: database.user,
        password: database.password
      });
      await conn.connect();

      const result = await conn.query(
        `SELECT datname FROM pg_catalog.pg_database WHERE datname = '${
          database.database
        }'`
      );
      let db = result.rows[0];

      if (dropDB) {
        await conn.query(`DROP DATABASE ${database.database};`);
        db = null;
      }

      if (!db) {
        await conn.query(`CREATE DATABASE ${database.database}`);
      }

      await conn.end();

      const sequelize = new Sequelize(
        database.database,
        database.user,
        database.password,
        {
          host: database.host,
          dialect: "postgres",
          pool: {
            max: 5,
            idle: 30000,
            acquire: 60000
          },
          define: {
            underscored: false,
            freezeTableName: false,
            timestamps: true
          },
          logging: debug ? console.log : false,
          operatorsAliases: false
        }
      );

      await sequelize.authenticate();
      debug && console.info("POSTGRES-DB  Conn Success.");

      global.models = require("./models")(sequelize, Sequelize);

      await sequelize.sync({ force: false });
      debug && console.info(`SequelizeJS :: All Models Loaded.`);

      resolve({ models: global.models, SequelizeOP: global.SequelizeOP });
    } catch (error) {
      reject(error);
    }
  });
