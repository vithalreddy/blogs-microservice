const Joi = require("joi");
const Boom = require("boom");

const ctrl = {};
module.exports = ctrl;
const { Blog, Comment } = global.models;

const commentSchema = Joi.object().keys({
  comment: Joi.string()
    .min(3)
    .required(),
  user: Joi.string()
    .min(3)
    .max(250)
    .required()
});

/**
 * @swagger
 * definitions:
 *  NewComment:
 *      type: object
 *      required:
 *          - comment
 *          - user
 *      properties:
 *          comment:
 *              type: string
 *              description: Comment Title
 *          user:
 *              type: string
 *              description: Commenting User
 *  Comment:
 *      allOf:
 *          -   $ref: '#/definitions/NewComment'
 *          -   required:
 *              -   id
 *          -   properties:
 *                  id:
 *                      type: integer
 *                  updatedAt:
 *                      type: string
 *                  createdAt:
 *                      type: string
 *
 *
 *
 * /blogs/{blogId}/comments:
 *   post:
 *     tags:
 *        - "comment"
 *     description: Add Comment to a Blog Entry
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: comment
 *         in: body
 *         description: comment object
 *         required: true
 *         schema:
 *            $ref: '#/definitions/NewComment'
 *       - name: blogId
 *         in: path
 *         description: blog id
 *         required: true
 *         type: integer
 *     responses:
 *       201:
 *         description: Successfully added Comment to a Blog Entry
 *       400:
 *          description: Invalid Comment Data or Blog Not Published
 *       404:
 *          description: Blog Entry Not Found
 */
ctrl.create = async (req, res, next) => {
  const { blogId } = req.params;

  if (!parseInt(blogId)) {
    throw Boom.notFound("Invalid Blog Id.");
  }

  const blog = await Blog.findOne({ where: { id: blogId } });
  if (!blog) {
    throw Boom.notFound("Blog Entry Not Found.");
  }

  if (!blog.isPublished) {
    throw Boom.badRequest("This Blog Post is Not Publised yet.");
  }

  const { comment, user } = req.body;

  const { error } = Joi.validate(req.body, commentSchema);
  if (error) {
    return next(error);
  }

  const commentObj = await Comment.create({ comment, user, blogId });
  res.status(201).json(commentObj);
};

/**
 * @swagger
 * /blogs/{blogId}:/comments/{commentId}:
 *   get:
 *     tags:
 *       - "comment"
 *     description: Get Single Comment
 *     produces:
 *      - application/json
 *     parameters:
 *       - name: blogId
 *         description: Blog Post id
 *         type: integer
 *         required: true
 *         in: path
 *       - name: commentId
 *         description: comment id
 *         type: integer
 *         required: true
 *         in: path
 *     responses:
 *       200:
 *         description: comment object
 *         schema:
 *             $ref: '#/definitions/Comment'
 *       404:
 *          description: Blog Post or Comment Not Found
 */
ctrl.get = async (req, res, next) => {
  const { blogId, commentId } = req.params;

  if (!parseInt(blogId)) {
    throw Boom.notFound("Invalid Blog Id.");
  }

  const blog = await Blog.findOne({ where: { id: blogId } });
  if (!blog) {
    throw Boom.notFound("Blog Entry Not Found.");
  }

  if (!parseInt(commentId)) {
    throw Boom.notFound("Comment Not Found.");
  }

  const comment = await Comment.findOne({
    where: { blogId, id: commentId },
    raw: true
  });

  if (!comment) {
    throw Boom.notFound("Comment Not Found.");
  }

  res.status(200).json(comment);
};

/**
 * @swagger
 * /blogs/{blogId}/comments:
 *   get:
 *     tags:
 *       - "comment"
 *     description: return all Blog Post's Comments paginated
 *     produces:
 *      - application/json
 *     parameters:
 *       -   name: page
 *           in: query
 *           type: number,
 *           description: page number of comments
 *       -   name: commentsPerPage
 *           in: query
 *           type: number
 *           description: number of comments per page
 *     responses:
 *       200:
 *         description: all blog posts
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Comment'
 *       404:
 *          description: Blog post not found or comments not found for the query
 */
ctrl.getAll = async (req, res, next) => {
  const { blogId } = req.params;

  if (!parseInt(blogId)) {
    throw Boom.notFound("Invalid Blog Id.");
  }

  const blog = await Blog.findOne({ where: { id: blogId } });
  if (!blog) {
    throw Boom.notFound("Blog Entry Not Found.");
  }

  let { page, commentsPerPage } = req.query;

  page = parseInt(page) || 1;
  commentsPerPage = parseInt(commentsPerPage) || 50;

  if (commentsPerPage > 50) {
    throw Boom.badRequest("Comments Per Page Can't be greater than 50.");
  }

  const limit = commentsPerPage;
  const offset = page * limit - limit;

  const query = {
    blogId
  };

  const result = await Comment.findAndCountAll({
    where: query,
    offset,
    limit,
    order: [["createdAt", "DESC"]]
  });

  if (!result.rows.length) {
    throw Boom.notFound("No Comments Found for This Query.");
  }

  const data = {
    comments: result.rows,
    totalCount: result.count,
    selectedPage: page,
    commentsPerPage,
    totalPages: Math.ceil(result.count / commentsPerPage)
  };

  res.status(200).json(data);
};
