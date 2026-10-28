import { Router } from "express";
import { getWallPosts, addWallPost, addActivityLog } from "../db.js";
import { requireUser } from "../middleware.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const posts = await getWallPosts();
    res.json(posts);
  } catch (err: any) {
    console.error("[Wall GET Error]:", err);
    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({ error: "Internal server error" });
    }
    res.status(500).json({ error: err.message || "Failed to fetch wall posts" });
  }
});

router.post("/", requireUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Unauthorized: Valid user token required." });
    }

    const { text, rating, image, avatar, category } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Review text is required." });
    }
    const cleanText = text.trim();
    if (cleanText.length > 1000) {
      return res.status(400).json({ error: "Review text must be at most 1000 characters." });
    }

    // Avatar validation: must be https URL and <= 500 chars if provided
    let cleanAvatar: string | undefined = undefined;
    if (avatar !== undefined && avatar !== null && avatar !== "") {
      if (typeof avatar !== "string" || !avatar.startsWith("https://") || avatar.length > 500) {
        return res.status(400).json({ error: "Avatar must be an https URL of at most 500 characters." });
      }
      cleanAvatar = avatar.trim();
    }

    // Image validation: must be https URL and <= 500 chars if provided
    let cleanImage: string | undefined = undefined;
    if (image !== undefined && image !== null && image !== "") {
      if (typeof image !== "string" || !image.startsWith("https://") || image.length > 500) {
        return res.status(400).json({ error: "Image must be an https URL of at most 500 characters." });
      }
      cleanImage = image.trim();
    }

    // Max 5 posts per user per day
    const existingPosts = await getWallPosts();
    const todayStr = new Date().toISOString().split("T")[0];
    const userTodayPosts = existingPosts.filter(p => {
      if (p.authorUid !== user.uid) return false;
      const postDate = p.createdAt ? p.createdAt.split("T")[0] : p.date;
      return postDate === todayStr;
    });

    if (userTodayPosts.length >= 5) {
      return res.status(429).json({ error: "Daily limit reached. You can only create up to 5 posts per day." });
    }

    // Ignore body author fields - name comes strictly from verified token
    const authorName = (user.displayName && user.displayName.trim())
      ? user.displayName.trim()
      : (user.email ? user.email.split("@")[0] : "Coffee Explorer");

    const newPost = await addWallPost({
      author: authorName,
      authorUid: user.uid,
      avatar: cleanAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
      text: cleanText,
      rating: Number(rating) || 5,
      image: cleanImage,
      category: typeof category === "string" && category.trim() ? category.trim() : "review"
    });

    await addActivityLog(`${newPost.author} shared a post on the Community Wall!`);

    const wallPosts = await getWallPosts();
    res.json({ success: true, wallPosts });
  } catch (err: any) {
    console.error("[Wall POST Error]:", err);
    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({ error: "Internal server error" });
    }
    res.status(500).json({ error: err.message || "Failed to add wall post" });
  }
});

export default router;
