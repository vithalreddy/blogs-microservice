const Routes = require("express").Router();
const catchErrors = require("../middlewares/catchErrors");

// Comment Routes
const commentCtrl = require("../controllers/comment.controller");

Routes.route("/blogs/:blogId/comments")
  .get(catchErrors(commentCtrl.getAll))
  .post(catchErrors(commentCtrl.create));

Routes.route("/blogs/:blogId/comments/:commentId").get(
  catchErrors(commentCtrl.get)
);

module.exports = Routes;
