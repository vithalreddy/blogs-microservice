const Routes = require("express").Router();
const catchErrors = require("../middlewares/catchErrors");

// Blog Routes
const blogCtrl = require("../controllers/blog.controller");

Routes.route("/blogs")
  .get(catchErrors(blogCtrl.getAllPublished))
  .post(catchErrors(blogCtrl.create));

Routes.route("/blogs/all").get(catchErrors(blogCtrl.getAll));

Routes.route("/blogs/:blogId")
  .get(catchErrors(blogCtrl.get))
  .delete(catchErrors(blogCtrl.delete));

Routes.route("/blogs/:blogId/publish").post(catchErrors(blogCtrl.publish));

module.exports = Routes;
