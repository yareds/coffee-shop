import { Router } from "express";
import { getState, saveDb, getProfile } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const state = getState();
  res.json(state.wallPosts);
});

router.post("/", (req, res) => {
  const state = getState();
  const { author, text, rating, image, category } = req.body;
  const newPost = {
    id: "p_" + Date.now(),
    author: author || "Coffee Lover",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
    text,
    rating: Number(rating) || 5,
    image,
    date: new Date().toISOString().split("T")[0],
    likes: 0,
    category: category || "review"
  };

  state.wallPosts.unshift(newPost);

  const profile = getProfile(req);
  profile.points += 15;

  state.shopStats.activityLog.unshift({
    id: "act_" + Date.now(),
    text: `${newPost.author} contributed to the Community Wall! (+15 pts)`,
    time: "Just now"
  });

  saveDb();
  res.json({ success: true, wallPosts: state.wallPosts, loyalty: profile });
});

export default router;
