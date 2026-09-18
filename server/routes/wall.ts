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
    const userEmail = ((req.headers["x-user-email"] as string) || req.body?.authorEmail || req.body?.userEmail || "").trim().toLowerCase();
    const userId = ((req.headers["x-user-id"] as string) || req.body?.authorUid || req.body?.userId || "").trim();

    // Enforce that user must be signed in to leave a review or wall post
    if (!userEmail && !userId) {
      return res.status(401).json({
        error: "Authentication required: You must be signed in to leave a review."
      });
    }

    const { author, text, rating, image, category } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Review text is required." });
    }

    const newPost = await addWallPost({
      author: author || userEmail.split("@")[0] || "Coffee Explorer",
      authorUid: userId || undefined,
      authorEmail: userEmail || undefined,
      avatar: req.body?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
      text: text.trim(),
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
