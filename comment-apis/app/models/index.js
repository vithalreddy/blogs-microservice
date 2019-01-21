module.exports = (sequelize, Sequelize) => {
  const models = {};

  models.Blog = sequelize.define(
    "blog",
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      post: {
        type: Sequelize.TEXT,
        defaultValue: "",
        allowNull: true
      },
      author: { type: Sequelize.STRING, allowNull: false },
      isPublished: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      tags: { type: Sequelize.ARRAY(Sequelize.STRING) }
    },
    { timestamps: true }
  );

  models.Comment = sequelize.define(
    "comment",
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      comment: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      user: { type: Sequelize.STRING, allowNull: false }
    },
    { timestamps: true }
  );

  // relations
  models.Comment.belongsTo(models.Blog, {
    foreignKey: "blogId",
    targetKey: "id"
  });

  return models;
};
