import { Router } from "express";
import { getWallPosts, addWallPost, getProfile, saveProfile, addActivityLog } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const posts = await getWallPosts();
    res.json(posts);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch wall posts" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { author, text, rating, image, category } = req.body;
    const newPost = await addWallPost({
      author: author || "Coffee Lover",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
      text,
      rating: Number(rating) || 5,
      image,
      category: category || "review"
    });

    const profile = await getProfile(req);
    profile.points += 15;
    await saveProfile(profile);

    await addActivityLog(`${newPost.author} contributed to the Community Wall! (+15 pts)`);

    const wallPosts = await getWallPosts();
    res.json({ success: true, wallPosts, loyalty: profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to add wall post" });
  }
});

export default router;
