import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true, maxlength: 1500 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: true }
);

const forumPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    tags: [{ type: String, trim: true, maxlength: 40 }],

    author: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    comments: [commentSchema],
  },
  { timestamps: true }
);

const ForumPost = mongoose.model("forum_post", forumPostSchema);
export default ForumPost;
