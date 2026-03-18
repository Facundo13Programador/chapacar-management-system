// routes/forumRoutes.js
import express from "express";
import ForumPost from "../models/forumPostModel.js";
import { isAuth } from "../utils/authUtils.js";
import * as perms from "../utils/permissions.js";

const forumRouter = express.Router();


// GET /api/forum/posts
forumRouter.get(
  "/posts",
  isAuth,
  perms.requirePermission("forum", [perms.SCOPES.canView]),
  async (req, res, next) => {
    try {
      const posts = await ForumPost.find({})
        .populate("author", "name role avatarUrl")
        .populate("comments.author", "name role avatarUrl")
        .sort({ createdAt: -1 });

      res.json(posts);
    } catch (e) {
      next(e);
    }
  }
);

// POST /api/forum/posts (crear post)
forumRouter.post(
  "/posts",
  isAuth,
  perms.requirePermission("forum", [perms.SCOPES.canCreate]),
  async (req, res, next) => {
    try {
      const { title, content, tags = [] } = req.body;

      const post = await ForumPost.create({
        title,
        content,
        tags,
        author: req.user.id, 
      });

      const full = await ForumPost.findById(post._id).populate(
        "author",
        "name role avatarUrl"
      );

      res.status(201).json(full);
    } catch (e) {
      next(e);
    }
  }
);


forumRouter.post(
  "/posts/:id/comments",
  isAuth,
  perms.requirePermission("forum", [perms.SCOPES.canCreate]),
  async (req, res, next) => {
    try {
      const { content } = req.body;

      const post = await ForumPost.findById(req.params.id);
      if (!post) return res.status(404).json({ message: "Post no encontrado" });

      post.comments.push({ content, author: req.user.id });
      await post.save();

      const full = await ForumPost.findById(post._id)
        .populate("author", "name role avatarUrl")
        .populate("comments.author", "name role avatarUrl");

      res.status(201).json(full);
    } catch (e) {
      next(e);
    }
  }
);

export default forumRouter;
