const Joi = require("joi");
const Boom = require("boom");

const ctrl = {};
module.exports = ctrl;
const { Blog } = global.models;

const { SequelizeOP } = global;

const blogSchema = Joi.object().keys({
  title: Joi.string()
    .min(3)
    .max(250)
    .required(),
  post: Joi.string().allow(""),
  author: Joi.string()
    .min(3)
    .max(250)
    .required(),
  tags: Joi.array().items(Joi.string())
});

/**
 * @swagger
 * definitions:
 *  NewBlog:
 *      type: object
 *      required:
 *          - title
 *          - author
 *      properties:
 *          title:
 *              type: string
 *              description: Blog Post Title
 *          post:
 *              type: string
 *              description: Blog Post Data
 *          author:
 *              type: string
 *              description: Blog Post Author
 *          tags:
 *              type: array
 *              description: Blog Post Tags
 *              items:
 *                  type: string
 *  Blog:
 *      allOf:
 *          -   $ref: '#/definitions/NewBlog'
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
 * /blogs:
 *   post:
 *     tags:
 *        - "blog"
 *     description: Add New Blog Entry
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: blog
 *         in: body
 *         description: blog object
 *         required: true
 *         schema:
 *            $ref: '#/definitions/NewBlog'
 *     responses:
 *       201:
 *         description: Successfully added Blog Entry
 *       400:
 *          description: Invalid Blog Data
 *       409:
 *          description: Blog Already Exists
 */
ctrl.create = async (req, res, next) => {
  const { title, post, author, tags } = req.body;

  const { error } = Joi.validate(req.body, blogSchema);
  if (error) {
    return next(error);
  }

  const isDuplicateBlog = await Blog.findOne({
    where: { title: { [SequelizeOP.iLike]: `%${title}%` } },
    attributes: ["id"]
  });
  if (isDuplicateBlog) {
    return next(Boom.conflict("This Blog Entry Already Exists."));
  }
  const blog = await Blog.create({ title, post, author, tags });
  res.status(201).json(blog);
};

/**
 * @swagger
 * /blogs/{blogId}:
 *   get:
 *     tags:
 *       - "blog"
 *     description: Get Single Blog Post
 *     produces:
 *      - application/json
 *     parameters:
 *       - name: blogId
 *         description: Blog Post id
 *         type: integer
 *         required: true
 *         in: path
 *     responses:
 *       200:
 *         description: blog post
 *         schema:
 *             $ref: '#/definitions/Blog'
 *       404:
 *          description: Blog Post Not Found
 */
ctrl.get = async (req, res, next) => {
  const { blogId } = req.params;

  if (!blogId || !parseInt(blogId)) {
    throw Boom.notFound("Invalid Blog Id.");
  }

  const blog = await Blog.findOne({ where: { id: blogId } });
  if (!blog) {
    throw Boom.notFound("Blog Entry Not Found.");
  }

  res.status(200).json(blog);
};

/**
 * @swagger
 * /blogs/{blogId}/publish:
 *   post:
 *     tags:
 *        - "blog"
 *     description: Publish Blog Post
 *     produces:
 *      - application/json
 *     parameters:
 *       - name: blogId
 *         description: Blog Post id
 *         type: integer
 *         required: true
 *         in: path
 *     responses:
 *       200:
 *         description: publish blog post
 *         schema:
 *             $ref: '#/definitions/Blog'
 *       404:
 *          description: Blog Post Not Found
 */
ctrl.publish = async (req, res, next) => {
  const { blogId } = req.params;

  if (!blogId || !parseInt(blogId)) {
    throw Boom.notFound("Invalid Blog Id.");
  }

  const blog = await Blog.findOne({ where: { id: blogId } });
  if (!blog) {
    throw Boom.notFound("Blog Entry Not Found.");
  }

  if (blog.isPublished) {
    throw Boom.badRequest("Blog Entry is Already Published.");
  }

  await blog.update({ isPublished: true });

  res.status(200).json(blog);
};

/**
 * @swagger
 * /blogs/{blogId}/publish:
 *   delete:
 *     tags:
 *        - "blog"
 *     description: Delete Blog Post
 *     produces:
 *      - application/json
 *     parameters:
 *       - name: blogId
 *         description: Blog Post id
 *         type: integer
 *         required: true
 *         in: path
 *     responses:
 *       200:
 *         description: deletes blog post
 *       404:
 *          description: Blog Post Not Found
 */
ctrl.delete = async (req, res, next) => {
  const { blogId } = req.params;

  if (!blogId || !parseInt(blogId)) {
    throw Boom.notFound("Invalid Blog Id.");
  }

  const blog = await Blog.findOne({ where: { id: blogId } });
  if (!blog) {
    throw Boom.notFound("Blog Entry Not Found.");
  }
  await blog.destroy();

  res.status(204).json(blog);
};

/**
 * @swagger
 * /blogs/all:
 *   get:
 *     tags:
 *       - "blog"
 *     description: return all Blog Posts
 *     produces:
 *      - application/json
 *     parameters:
 *       -   name: page
 *           in: query
 *           type: number,
 *           description: page number of blogs
 *       -   name: blogsPerPage
 *           in: query
 *           type: number
 *           description: number of posts per page
 *       -   name: title
 *           in: query
 *           title: string
 *           description: search blogs by title
 *     responses:
 *       200:
 *         description: all blog posts
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Blog'
 *       404:
 *          description: Blog posts not found for the query
 */
ctrl.getAll = async (req, res, next) => {
  let { page, blogsPerPage, title } = req.query;

  page = parseInt(page) || 1;
  blogsPerPage = parseInt(blogsPerPage) || 50;

  if (blogsPerPage > 50) {
    throw Boom.badRequest("Blogs Per Page Can't be greater than 50.");
  }

  const limit = blogsPerPage;
  const offset = page * limit - limit;

  const query = {};

  if (title) {
    query.title = {
      [SequelizeOP.iLike]: `%${title}%`
    };
  }

  const result = await Blog.findAndCountAll({
    where: query,
    offset,
    limit,
    order: [["title", "ASC"]],
    subQuery: false
  });

  if (!result.rows.length) {
    throw Boom.notFound("No Blog Entries Not Found for This Query.");
  }

  const data = {
    blogs: result.rows,
    totalCount: result.count,
    selectedPage: page,
    blogsPerPage,
    totalPages: Math.ceil(result.count / blogsPerPage)
  };

  res.status(200).json(data);
};

/**
 * @swagger
 * /blogs:
 *   get:
 *     tags:
 *       - "blog"
 *     description: return all published Blog Posts
 *     produces:
 *      - application/json
 *     parameters:
 *       -   name: page
 *           in: query
 *           type: number,
 *           description: page number of blogs
 *       -   name: blogsPerPage
 *           in: query
 *           type: number
 *           description: number of posts per page
 *       -   name: title
 *           in: query
 *           title: string
 *           description: search blogs by title
 *     responses:
 *       200:
 *         description: all published blog posts
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Blog'
 *       404:
 *          description: Blog posts not found for the query
 */
ctrl.getAllPublished = async (req, res, next) => {
  let { page, blogsPerPage, title } = req.query;

  page = parseInt(page) || 1;
  blogsPerPage = parseInt(blogsPerPage) || 50;

  if (blogsPerPage > 50) {
    throw Boom.badRequest("Blogs Per Page Can't be greater than 50.");
  }

  const limit = blogsPerPage;
  const offset = page * limit - limit;

  const query = { isPublished: true };

  if (title) {
    query.title = {
      [SequelizeOP.iLike]: `%${title}%`
    };
  }

  const result = await Blog.findAndCountAll({
    where: query,
    limit,
    offset,
    order: [["title", "ASC"]]
  });

  if (!result.rows.length) {
    throw Boom.notFound("No Blog Entries Not Found for This Query.");
  }

  const data = {
    blogs: result.rows,
    totalCount: result.count,
    selectedPage: page,
    blogsPerPage,
    totalPages: Math.ceil(result.count / blogsPerPage)
  };

  res.status(200).json(data);
};
