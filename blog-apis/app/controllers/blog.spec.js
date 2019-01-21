/* eslint-env mocha */

const request = require("supertest");
const { expect } = require("chai");

const baseRoute = "/api/v1";

let api;

describe("Blog Related APIs", () => {
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
    const blog = {
      title: `new blog`,
      author: "VithalReddy",
      post: "Some text here",
      tags: ["tag 1", "tag 2"]
    };

    it("should create new blog", async () => {
      blog.title += Date.now();
      const result = await request(api)
        .post(`${baseRoute}/blogs`)
        .send(blog)
        .expect(201);

      const newBlog = result.body;

      expect(newBlog.title).to.eq(blog.title);
    });

    it("should not create duplicate blogs", async () => {
      blog.title += Date.now();

      await request(api)
        .post(`${baseRoute}/blogs`)
        .send(blog)
        .expect(201);

      await request(api)
        .post(`${baseRoute}/blogs`)
        .send(blog)
        .expect(409);
    });

    it("should not create blog without title and/or author", async () => {
      blog.title += Date.now();

      await request(api)
        .post(`${baseRoute}/blogs`)
        .send({ ...blog, title: undefined })
        .expect(400);

      await request(api)
        .post(`${baseRoute}/blogs`)
        .send({ ...blog, author: undefined })
        .expect(400);
    });
    it("should validate tags should be array of strings", async () => {
      blog.title += Date.now();

      const tags = "string";

      await request(api)
        .post(`${baseRoute}/blogs`)
        .send({ ...blog, tags })
        .expect(400);
    });
  });

  describe("publish", () => {
    const blog = {
      title: `new blog`,
      author: "VithalReddy",
      post: "Some text here",
      tags: ["tag 1", "tag 2"]
    };

    it("should publish blog by id only if blog is a draft and id is valid", async () => {
      blog.title += Date.now();
      const { body } = await request(api)
        .post(`${baseRoute}/blogs`)
        .send(blog)
        .expect(201);
      const newBlog = body;

      await request(api)
        .post(`${baseRoute}/blogs/${newBlog.id}/publish`)
        .expect(200);

      await request(api)
        .post(`${baseRoute}/blogs/${newBlog.id}/publish`)
        .expect(400);

      await request(api)
        .post(`${baseRoute}/blogs/50000000/publish`)
        .expect(404);

      await request(api)
        .post(`${baseRoute}/blogs/invalidBlogId/publish`)
        .expect(404);
    });
  });

  describe("delete", () => {
    const blog = {
      title: `new blog`,
      author: "VithalReddy",
      post: "Some text here",
      tags: ["tag 1", "tag 2"]
    };

    it("should should also delete comments", async () => {
      blog.title += Date.now();
      const { body } = await request(api)
        .post(`${baseRoute}/blogs`)
        .send(blog)
        .expect(201);
      const newBlog = body;

      await request(api)
        .post(`${baseRoute}/blogs/${newBlog.id}/publish`)
        .expect(200);

      const { Comment } = global.models;
      await Comment.create({
        comment: "some comment",
        user: "some user",
        blogId: newBlog.id
      });

      await request(api)
        .delete(`${baseRoute}/blogs/${newBlog.id}`)
        .expect(204);

      const comments = await Comment.findAll({
        where: { blogId: newBlog.id },
        raw: true
      });
      expect(comments.length).to.lessThan(1);
    });

    it("should delete blog by id and validate blog id", async () => {
      blog.title += Date.now();
      const { body } = await request(api)
        .post(`${baseRoute}/blogs`)
        .send(blog)
        .expect(201);
      const newBlog = body;

      await request(api)
        .delete(`${baseRoute}/blogs/${newBlog.id}`)
        .expect(204);

      await request(api)
        .delete(`${baseRoute}/blogs/error`)
        .expect(404);

      await request(api)
        .delete(`${baseRoute}/blogs/50000000`)
        .expect(404);
    });
  });

  describe("get", () => {
    const blog = {
      title: `new blog`,
      author: "VithalReddy",
      post: "Some text here",
      tags: ["tag 1", "tag 2"]
    };

    it("should fetch blog by id", async () => {
      blog.title += Date.now();
      const result = await request(api)
        .post(`${baseRoute}/blogs`)
        .send(blog)
        .expect(201);

      const newBlog = result.body;

      const fetchedBlog = await request(api)
        .get(`${baseRoute}/blogs/${newBlog.id}`)
        .expect(200);

      expect(fetchedBlog.body.title).to.eq(newBlog.title);
    });

    it("should throw 404 err on wrong and/or invalid blog id", async () => {
      await request(api)
        .get(`${baseRoute}/blogs/string`)
        .expect(404);

      await request(api)
        .get(`${baseRoute}/blogs/9999999`)
        .expect(404);
    });
  });

  describe("get all blogs", () => {
    it("should fetch published and draft blogs", async () => {
      const result = await request(api)
        .get(`${baseRoute}/blogs/all`)
        .expect(200);

      const { blogs } = result.body;
      blogs.every(el => expect(el.isPublished).to.oneOf([true, false]));
    });

    it("should only fetch published blogs max 50 per request and should validate pagination details", async () => {
      await request(api)
        .get(`${baseRoute}/blogs/all`)
        .query({ blogsPerPage: 5000 })
        .expect(400);

      await request(api)
        .get(`${baseRoute}/blogs/all`)
        .query({ blogsPerPage: 60 })
        .expect(400);
    });

    it("should throw 404 when blogs are not found some query", async () => {
      await request(api)
        .get(`${baseRoute}/blogs/all`)
        .query({ page: 5000 })
        .expect(404);
    });

    it("should search blogs based blog title case insensitively", async () => {
      const blog = {
        title: `New Blog ${Date.now()}`,
        author: "VithalReddy",
        post: "Some text here",
        tags: ["tag 1", "tag 2"]
      };

      const title = blog.title.toLowerCase();
      await request(api)
        .post(`${baseRoute}/blogs`)
        .send(blog)
        .expect(201);

      const result = await request(api)
        .get(`${baseRoute}/blogs/all`)
        .query({ title })
        .expect(200);

      result.body.blogs.every(el =>
        expect(el.title.toLowerCase()).to.include(title)
      );
    });
  });

  // only published blogs
  describe("get all published", () => {
    it("should only fetch published blogs", async () => {
      const result = await request(api)
        .get(`${baseRoute}/blogs`)
        .expect(200);

      const { blogs } = result.body;
      blogs.every(el => expect(el.isPublished).to.eq(true));
    });

    it("should only fetch published blogs max 50 per request and should validate pagination details", async () => {
      await request(api)
        .get(`${baseRoute}/blogs`)
        .query({ blogsPerPage: 5000 })
        .expect(400);

      await request(api)
        .get(`${baseRoute}/blogs`)
        .query({ blogsPerPage: 60 })
        .expect(400);
    });

    it("should throw 404 when blogs are not found some query", async () => {
      await request(api)
        .get(`${baseRoute}/blogs`)
        .query({ page: 5000 })
        .expect(404);
    });

    it("should search blogs based blog title case insensitively", async () => {
      const title = "New Blog";

      const blog = {
        title: `${title} ${Date.now()}`,
        author: "VithalReddy",
        post: "Some text here",
        tags: ["tag 1", "tag 2"]
      };

      const { body } = await request(api)
        .post(`${baseRoute}/blogs`)
        .send(blog)
        .expect(201);

      await request(api)
        .post(`${baseRoute}/blogs/${body.id}/publish`)
        .expect(200);

      const result = await request(api)
        .get(`${baseRoute}/blogs`)
        .query({ title })
        .expect(200);

      result.body.blogs.every(el =>
        expect(el.title.toLowerCase()).to.include(title.toLowerCase())
      );
    });
  });
});
