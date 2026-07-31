import React, { useState, useEffect } from "react";
import { MessageSquare, Sparkles, Heart, Image as ImageIcon, Send, Star, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WallPost } from "../types";

export default function CommunityWall({ onPostAdded }: { onPostAdded: (points: number, reason: string) => void }) {
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<'review' | 'photo' | 'latte-art' | 'story'>('review');
  const [rating, setRating] = useState(5);
  
  // Advanced ratings
  const [ratings, setRatings] = useState({
    taste: 5,
    presentation: 5,
    service: 5,
    atmosphere: 5,
    cleanliness: 5,
    barista: 5
  });

  const [imageUrl, setImageUrl] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadWallPosts = () => {
    setLoading(true);
    fetch("/api/wall")
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadWallPosts();
  }, []);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const payload = {
      author: author.trim() || "Anonymous Coffee Lover",
      text: newPostText,
      rating: category === "review" ? rating : undefined,
      image: imageUrl.trim() || undefined,
      category
    };

    fetch("/api/wall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPosts(data.wallPosts);
          setNewPostText("");
          setAuthor("");
          setImageUrl("");
          setShowForm(false);
          // Reward points
          onPostAdded(15, "Contributed to Community Wall");
        }
      })
      .catch(e => console.error(e));
  };

  const handleLike = (id: string) => {
    setPosts(prev =>
      prev.map(p => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  return (
    <div id="community-wall" className="bg-[#1a1513] p-6 rounded-2xl border border-[#2c221e] flex flex-col gap-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#c89d7c]/10 text-[#c89d7c] border border-[#c89d7c]/20">COMMUNITY</span>
            <span className="text-xs text-stone-500 font-mono">Buna Social Wall</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">The Community Coffee Wall</h3>
          <p className="text-xs text-stone-400 mt-0.5">Share your latte art, roast stories, or review our craft. Every post earns you 15 loyalty points!</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-4 py-2 bg-[#c89d7c] hover:bg-[#b08766] text-black text-xs font-black rounded-xl transition-all"
        >
          {showForm ? "Cancel Post" : "✍ Post a Coffee Review"}
        </button>
      </div>

      {/* Slide-out Form Drawer */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={handlePostSubmit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#120f0e] p-5 rounded-xl border border-[#c89d7c]/20 flex flex-col gap-4 text-xs"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-stone-400 font-medium">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Abebe K."
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-stone-200"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-stone-400 font-medium">Post Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-stone-200"
                >
                  <option value="review">Coffee Tasting Review</option>
                  <option value="latte-art">Latte Art Photo</option>
                  <option value="story">Ethiopian Coffee Story</option>
                  <option value="photo">Atmosphere Capture</option>
                </select>
              </div>
            </div>

            {/* Custom Multi-Criteria Rating (Taste, Presentation, Barista, cleanliness) */}
            {category === "review" && (
              <div className="bg-[#181412] p-4 rounded-xl border border-[#241c19]">
                <p className="text-xs font-bold font-mono text-[#c89d7c] mb-3 uppercase tracking-wider">Detailed Cafe Ratings</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.keys(ratings).map((key) => {
                    const label = key.charAt(0).toUpperCase() + key.slice(1);
                    const currentRating = ratings[key as keyof typeof ratings];
                    return (
                      <div key={key} className="flex flex-col gap-1 bg-[#120f0e] p-2 rounded border border-stone-800">
                        <span className="text-[10px] text-stone-500 font-mono">{label}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setRatings(prev => ({ ...prev, [key]: star }))}
                              className="text-xs transition-all hover:scale-110"
                            >
                              <Star size={12} className={star <= currentRating ? "fill-amber-400 text-amber-400" : "text-stone-700"} />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-stone-400 font-medium">Tasting Notes & Review Content</label>
              <textarea
                required
                placeholder="What was special about your cup? Let us know..."
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                className="bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-stone-200 h-20 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-stone-400 font-medium">Photo URL (optional)</label>
              <input
                type="text"
                placeholder="Paste an image URL, or try: https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-stone-200 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#c89d7c] hover:bg-[#b08766] text-black font-bold py-2.5 rounded-lg text-xs transition-all"
            >
              ✓ Publish Review to Wall (+15 Points)
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Grid of Posts */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#c89d7c]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-[#120f0e] rounded-xl p-4 border border-[#241c19] flex flex-col justify-between">
              
              {/* Post Author Card */}
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <img src={post.avatar} className="h-8 w-8 rounded-full object-cover border border-stone-700" alt="" />
                    <div>
                      <h5 className="text-xs font-bold text-white">{post.author}</h5>
                      <span className="text-[9px] font-mono text-stone-500">{post.date}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-[#c89d7c] bg-[#c89d7c]/10 border border-[#c89d7c]/20 px-2 py-0.5 rounded-full uppercase">
                    {post.category}
                  </span>
                </div>

                {/* Rating if present */}
                {post.rating && (
                  <div className="flex gap-0.5 mb-2.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={11} className={star <= (post.rating || 0) ? "fill-amber-400 text-amber-400" : "text-stone-800"} />
                    ))}
                  </div>
                )}

                {/* Main Text */}
                <p className="text-xs text-stone-300 leading-relaxed mb-3">
                  "{post.text}"
                </p>

                {/* Optional Attached Photo */}
                {post.image && (
                  <img src={post.image} className="w-full h-40 object-cover rounded-lg border border-stone-800 mb-3" alt="" />
                )}
              </div>

              {/* Interaction Row */}
              <div className="flex justify-between items-center pt-2.5 border-t border-[#1e1715] mt-1 text-[11px] font-mono text-stone-500">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-1.5 hover:text-red-400 transition-all cursor-pointer"
                >
                  <Heart size={12} className="fill-current text-stone-600 hover:text-red-400" />
                  <span>{post.likes} Likes</span>
                </button>
                <span className="text-[10px]">Verified Visit ✓</span>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
