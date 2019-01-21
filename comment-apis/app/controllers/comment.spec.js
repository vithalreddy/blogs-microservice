/* eslint-env mocha */

const request = require("supertest");
const { expect } = require("chai");

const baseRoute = "/api/v1";

let api;

describe("Comment Relating APIs", () => {
  before(async () => {
    const { models, SequelizeOP } = await require("../db")(false, true); // wait for db connection
    global.models = models;
    global.SequelizeOP = SequelizeOP;
    api = require("../app")();
  });

  after(async () => {
    const { Blog, Comment } = global.models;
    await Blog.destroy({ where: {} });
    await Comment.destroy({ where: {} });
  });

  describe("create", () => {
    const blogObj = {
      title: `new blog`,
      author: "VithalReddy",
      post: "Some text here",
      tags: ["tag 1", "tag 2"],
      isPublished: true
    };

    it("should add new comment to blog if blog exists", async () => {
      const { Blog } = global.models;
      blogObj.title += Date.now();
      const { dataValues } = await Blog.create(blogObj);
      const blog = dataValues;
      const comment = {
        comment: `new blog`,
        user: "VithalReddy"
      };

      const result = await request(api)
        .post(`${baseRoute}/blogs/${blog.id}/comments`)
        .send(comment)
        .expect(201);

      expect(result.body.comment).to.eq(comment.comment);
      expect(result.body.blogId).to.eq(blog.id);

      await request(api)
        .post(`${baseRoute}/blogs/${blog.id}/comments`)
        .send({ user: "vithalreddy", comment: "" })
        .expect(400);

      await request(api)
        .post(`${baseRoute}/blogs/invalid/comments`)
        .send(comment)
        .expect(404);
      await request(api)
        .post(`${baseRoute}/blogs/500000/comments`)
        .send(comment)
        .expect(404);
    });

    it("should add new comment to blog only if blog post is published and blog exists", async () => {
      const { Blog } = global.models;
      blogObj.title += Date.now();
      blogObj.isPublished = false;
      const { dataValues } = await Blog.create(blogObj);
      const blog = dataValues;
      const comment = {
        comment: `new blog`,
        user: "VithalReddy"
      };

      await request(api)
        .post(`${baseRoute}/blogs/${blog.id}/comments`)
        .send(comment)
        .expect(400);
    });
  });

  describe("get single comment", () => {
    const blogObj = {
      title: `new blog`,
      author: "VithalReddy",
      post: "Some text here",
      tags: ["tag 1", "tag 2"],
      isPublished: true
    };

    it("should fetch comment from blog if blog and comment exists", async () => {
      const { Blog } = global.models;
      blogObj.title += Date.now();
      const { dataValues } = await Blog.create(blogObj);
      const blog = dataValues;
      const comment = {
        comment: `new blog`,
        user: "VithalReddy"
      };

      const result = await request(api)
        .post(`${baseRoute}/blogs/${blog.id}/comments`)
        .send(comment)
        .expect(201);

      await request(api)
        .get(`${baseRoute}/blogs/${blog.id}/comments/${result.body.id}`)
        .expect(200);

      await request(api)
        .get(`${baseRoute}/blogs/50000/comments/${result.body.id}`)
        .expect(404);

      await request(api)
        .get(`${baseRoute}/blogs/invalid/comments/${result.body.id}`)
        .expect(404);

      await request(api)
        .get(`${baseRoute}/blogs/${blog.id}/comments/55555`)
        .expect(404);

      await request(api)
        .get(`${baseRoute}/blogs/${blog.id}/comments/invalid`)
        .expect(404);
    });
  });

  describe("get all comments", () => {
    const blogObj = {
      title: `new blog`,
      author: "VithalReddy",
      post: "Some text here",
      tags: ["tag 1", "tag 2"],
      isPublished: true
    };

    it("should fetch comments of a blog paginated if blog exists", async () => {
      const { Blog } = global.models;
      blogObj.title += Date.now();
      const { dataValues } = await Blog.create(blogObj);
      const blog = dataValues;
      const comment = {
        comment: `new blog`,
        user: "VithalReddy"
      };

      await request(api)
        .post(`${baseRoute}/blogs/${blog.id}/comments`)
        .send(comment)
        .expect(201);

      const result = await request(api)
        .get(`${baseRoute}/blogs/${blog.id}/comments`)
        .expect(200);

      const { comments } = result.body;
      expect(comments.length).greaterThan(0);

      await request(api)
        .get(`${baseRoute}/blogs/50000000/comments`)
        .expect(404);
    });

    it("should fetch comments max 50 per request and should validate pagination details", async () => {
      const { Blog } = global.models;
      blogObj.title += Date.now();
      const { dataValues } = await Blog.create(blogObj);
      const blog = dataValues;
      const comment = {
        comment: `new blog`,
        user: "VithalReddy"
      };

      await request(api)
        .post(`${baseRoute}/blogs/${blog.id}/comments`)
        .send(comment)
        .expect(201);

      await request(api)
        .get(`${baseRoute}/blogs/${blog.id}/comments`)
        .query({ commentsPerPage: 5000 })
        .expect(400);

      await request(api)
        .get(`${baseRoute}/blogs/invalid/comments`)
        .expect(404);

      await request(api)
        .get(`${baseRoute}/blogs/${blog.id}/comments`)
        .query({ commentsPerPage: 60 })
        .expect(400);

      await request(api)
        .get(`${baseRoute}/blogs/${blog.id}/comments`)
        .query({ commentsPerPage: 40 })
        .expect(200);
    });

    it("should throw 404 when comments are not found some query", async () => {
      const { Blog } = global.models;
      blogObj.title += Date.now();
      const { dataValues } = await Blog.create(blogObj);
      const blog = dataValues;
      const comment = {
        comment: `new blog`,
        user: "VithalReddy"
      };

      await request(api)
        .post(`${baseRoute}/blogs/${blog.id}/comments`)
        .send(comment)
        .expect(201);

      await request(api)
        .get(`${baseRoute}/blogs/${blog.id}/comments`)
        .query({ page: 5000 })
        .expect(404);
    });
  });
});
