import React, { useState, useEffect } from "react";
import { MessageSquare, Sparkles, Heart, Image as ImageIcon, Send, Star, HelpCircle, Lock, User, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WallPost, AuthUser } from "../types";
import { db, handleFirestoreError, OperationType, auth } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, increment } from "firebase/firestore";

interface CommunityWallProps {
  onPostAdded: (points: number, reason: string) => void;
  authUser?: AuthUser;
  onOpenLogin?: () => void;
}

export default function CommunityWall({ onPostAdded, authUser, onOpenLogin }: CommunityWallProps) {
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  // Check if current user is signed in
  const isLoggedIn = Boolean(
    (authUser && authUser.role !== 'guest' && (authUser.email || authUser.name)) ||
    auth.currentUser
  );

  // Prepopulate author name when signed in
  useEffect(() => {
    if (isLoggedIn) {
      const activeName = authUser?.name || auth.currentUser?.displayName || (authUser?.email ? authUser.email.split("@")[0] : "");
      if (!author && activeName) {
        setAuthor(activeName);
      }
    }
  }, [authUser, isLoggedIn]);

  useEffect(() => {
    const postsRef = collection(db, "community_posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedPosts: WallPost[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              author: data.author || "Anonymous",
              authorUid: data.authorUid || undefined,
              authorEmail: data.authorEmail || undefined,
              avatar: data.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
              text: data.text || "",
              date: data.date || "Just now",
              category: data.category || "review",
              likes: data.likes || 0,
              rating: data.rating || 5,
              image: data.image || undefined,
              createdAt: data.createdAt
            };
          });
          setPosts(loadedPosts);
          setLoading(false);
        } else {
          // Fallback to Express API if Firestore collection empty
          fetch("/api/wall")
            .then(res => res.json())
            .then(data => {
              if (Array.isArray(data)) {
                setPosts(data);
              }
              setLoading(false);
            })
            .catch(e => {
              console.error(e);
              setLoading(false);
            });
        }
      },
      (error) => {
        console.warn("Firestore snapshot error, falling back to server route:", error);
        handleFirestoreError(error, OperationType.GET, "community_posts");
        fetch("/api/wall")
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setPosts(data);
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
    );

    return () => unsubscribe();
  }, []);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce that user must be signed in to leave a review
    if (!isLoggedIn) {
      if (onOpenLogin) {
        onOpenLogin();
      }
      return;
    }

    if (!newPostText.trim()) return;

    setSubmitting(true);

    const currentUser = auth.currentUser;
    const authorEmail = (authUser?.email || currentUser?.email || "").toLowerCase().trim();
    const authorUid = currentUser?.uid || authUser?.email || "verified_user";
    const authorName = author.trim() || currentUser?.displayName || authUser?.name || (authorEmail ? authorEmail.split("@")[0] : "Coffee Explorer");
    const avatar = currentUser?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100";

    try {
      await addDoc(collection(db, "community_posts"), {
        author: authorName,
        authorUid,
        authorEmail,
        text: newPostText.trim(),
        rating: category === "review" ? rating : null,
        ratings: category === "review" ? ratings : null,
        image: imageUrl.trim() || null,
        category,
        likes: 0,
        avatar,
        date: "Just now",
        createdAt: new Date().toISOString()
      });

      setNewPostText("");
      setImageUrl("");
      setShowForm(false);
      onPostAdded(15, "Contributed to Community Wall");
    } catch (err) {
      console.warn("Firestore post creation failed, trying server API fallback...", err);
      // Fallback to Express backend with authentication headers
      try {
        const res = await fetch("/api/wall", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-User-Email": authorEmail,
            "X-User-Id": authorUid
          },
          body: JSON.stringify({
            author: authorName,
            authorUid,
            authorEmail,
            avatar,
            text: newPostText.trim(),
            rating: category === "review" ? rating : undefined,
            image: imageUrl.trim() || undefined,
            category
          })
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.wallPosts)) {
          setPosts(data.wallPosts);
          setNewPostText("");
          setImageUrl("");
          setShowForm(false);
          onPostAdded(15, "Contributed to Community Wall");
        } else if (data.error) {
          alert(data.error);
        }
      } catch (e) {
        console.error("API fallback failed:", e);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (id: string) => {
    setPosts(prev =>
      prev.map(p => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    );
    try {
      const postRef = doc(db, "community_posts", id);
      await updateDoc(postRef, {
        likes: increment(1)
      });
    } catch (err) {
      // Local optimistic state already updated
    }
  };

  const handleActionClick = () => {
    if (!isLoggedIn) {
      // Open the login prompt for unauthenticated users
      if (onOpenLogin) onOpenLogin();
      setShowForm(true);
    } else {
      setShowForm(!showForm);
    }
  };

  return (
    <div id="community-wall" className="bg-[#1a3e29] p-6 rounded-2xl border border-[#295a3d] flex flex-col gap-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#2d824d]/20 text-[#42bd6c] border border-[#2d824d]/40">COMMUNITY</span>
            <span className="text-xs text-stone-300 font-mono">Buna Social Wall</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">The Community Coffee Wall</h3>
          <p className="text-xs text-stone-300 mt-0.5">Share your tasting notes, latte art, or review our craft. Every post earns you 15 loyalty points!</p>
        </div>

        <button
          onClick={handleActionClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2d824d] hover:bg-[#226a3f] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-950/20 cursor-pointer"
        >
          {showForm ? (
            "Cancel Review"
          ) : !isLoggedIn ? (
            <>
              <Lock size={13} className="text-emerald-200" />
              <span>✍ Sign In to Leave a Review</span>
            </>
          ) : (
            <>
              <span>✍ Post a Coffee Review</span>
            </>
          )}
        </button>
      </div>

      {/* Guest Sign-in Invitation Banner (visible when user is not signed in and form is closed) */}
      {!isLoggedIn && !showForm && (
        <div className="bg-[#122b1c] border border-[#2d824d]/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#2d824d]/20 text-[#42bd6c] border border-[#2d824d]/30 shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Have you tasted our single-origin coffees?</p>
              <p className="text-[11px] text-stone-300 mt-0.5">
                Sign in to leave a verified review, rate roast notes, and earn <strong>+15 Loyalty Points</strong> on your passport.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenLogin}
            className="whitespace-nowrap px-4 py-2 bg-[#2d824d] hover:bg-[#226a3f] text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <User size={13} />
            <span>Sign In to Review</span>
          </button>
        </div>
      )}

      {/* Slide-out Review Form Drawer or Sign-In Prompt Gate */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {!isLoggedIn ? (
              /* Auth Required Card */
              <div className="bg-[#122b1c] p-6 rounded-xl border border-[#295a3d] flex flex-col items-center text-center gap-3 text-xs">
                <div className="w-12 h-12 rounded-full bg-[#2d824d]/20 border border-[#2d824d]/40 flex items-center justify-center text-[#42bd6c]">
                  <Lock size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Sign In Required to Leave a Review</h4>
                  <p className="text-xs text-stone-300 max-w-md mx-auto mt-1 leading-relaxed">
                    To maintain authentic tasting feedback and award <strong>+15 Loyalty Beans</strong> to your account, you must be signed in with your Google or customer account.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#2d824d] hover:bg-[#226a3f] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-950/30 cursor-pointer"
                  >
                    <User size={14} />
                    <span>Sign In to Leave a Review</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 bg-[#224e38] hover:bg-[#2a5e44] text-stone-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-stone-400 font-mono mt-2 pt-3 border-t border-[#295a3d]/60 w-full max-w-sm">
                  <span className="flex items-center gap-1 text-[#42bd6c]">✓ Verified Explorer</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[#42bd6c]">✓ Taste & Craft Ratings</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[#42bd6c]">✓ +15 Points</span>
                </div>
              </div>
            ) : (
              /* Signed-in Review Form */
              <form
                onSubmit={handlePostSubmit}
                className="bg-[#122b1c] p-5 rounded-xl border border-[#295a3d] flex flex-col gap-4 text-xs"
              >
                {/* Verified Identity Badge */}
                <div className="bg-[#183b27] px-3.5 py-2.5 rounded-lg border border-[#2d824d]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={auth.currentUser?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                      className="h-7 w-7 rounded-full object-cover border border-[#42bd6c]"
                      alt="Reviewer avatar"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-stone-200 font-medium">Reviewing as <strong className="text-white">{authUser?.name || auth.currentUser?.displayName || "Explorer"}</strong></span>
                        <span className="text-[10px] text-[#42bd6c] font-mono font-bold bg-[#2d824d]/30 px-1.5 py-0.5 rounded border border-[#2d824d]/40 flex items-center gap-0.5">
                          <CheckCircle2 size={10} /> Verified Explorer
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">{authUser?.email || auth.currentUser?.email}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#42bd6c] font-mono font-semibold self-start sm:self-auto bg-[#2d824d]/20 px-2 py-0.5 rounded">
                    +15 Loyalty Beans
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-stone-300 font-medium">Display Name on Wall</label>
                    <input
                      type="text"
                      placeholder="e.g. Abebe K."
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="bg-[#224e38] border border-[#295a3d] rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:border-[#42bd6c]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-stone-300 font-medium">Post Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="bg-[#224e38] border border-[#295a3d] rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:border-[#42bd6c]"
                    >
                      <option value="review">Coffee Tasting Review</option>
                      <option value="latte-art">Latte Art Photo</option>
                      <option value="story">Ethiopian Coffee Story</option>
                      <option value="photo">Atmosphere Capture</option>
                    </select>
                  </div>
                </div>

                {/* Overall Star Rating */}
                {category === "review" && (
                  <div className="flex items-center justify-between bg-[#224e38]/70 p-3 rounded-lg border border-[#295a3d]">
                    <span className="text-xs text-stone-200 font-medium">Overall Coffee Rating</span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          className="text-sm transition-all hover:scale-125 cursor-pointer p-0.5"
                        >
                          <Star size={16} className={star <= rating ? "fill-amber-400 text-amber-400" : "text-stone-600"} />
                        </button>
                      ))}
                      <span className="ml-2 font-mono font-bold text-amber-300 text-xs">{rating}/5</span>
                    </div>
                  </div>
                )}

                {/* Custom Multi-Criteria Rating (Taste, Presentation, Barista, cleanliness) */}
                {category === "review" && (
                  <div className="bg-[#224e38] p-4 rounded-xl border border-[#295a3d]">
                    <p className="text-xs font-bold font-mono text-[#42bd6c] mb-3 uppercase tracking-wider">Detailed Cafe Ratings</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.keys(ratings).map((key) => {
                        const label = key.charAt(0).toUpperCase() + key.slice(1);
                        const currentRating = ratings[key as keyof typeof ratings];
                        return (
                          <div key={key} className="flex flex-col gap-1 bg-[#122b1c] p-2 rounded border border-[#295a3d]">
                            <span className="text-[10px] text-stone-300 font-mono">{label}</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => setRatings(prev => ({ ...prev, [key]: star }))}
                                  className="text-xs transition-all hover:scale-110 cursor-pointer"
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
                  <label className="text-stone-300 font-medium">Tasting Notes & Review Content</label>
                  <textarea
                    required
                    placeholder="What was special about your cup? Share tasting notes, acidity, body, and aroma..."
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    className="bg-[#224e38] border border-[#295a3d] rounded-lg px-3 py-2 text-stone-200 h-20 resize-none focus:outline-none focus:border-[#42bd6c]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-stone-300 font-medium">Photo URL (optional)</label>
                  <input
                    type="text"
                    placeholder="Paste an image URL, or try: https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="bg-[#224e38] border border-[#295a3d] rounded-lg px-3 py-2 text-stone-200 font-mono focus:outline-none focus:border-[#42bd6c]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#2d824d] hover:bg-[#226a3f] disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-xs transition-all shadow-md shadow-emerald-950/20 cursor-pointer"
                  >
                    {submitting ? "Publishing Review..." : "✓ Publish Review to Wall (+15 Points)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 bg-[#224e38] hover:bg-[#2a5e44] text-stone-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of Posts */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#42bd6c]"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center gap-2 text-stone-300">
          <MessageSquare size={32} className="text-stone-500 mb-1" />
          <p className="text-sm font-bold text-white">No reviews posted yet</p>
          <p className="text-xs text-stone-400">Be the first verified explorer to leave tasting notes on our wall!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => {
            const isAuthor = Boolean(
              (auth.currentUser?.uid && post.authorUid === auth.currentUser.uid) ||
              (authUser?.email && post.authorEmail && post.authorEmail.toLowerCase() === authUser.email.toLowerCase())
            );

            return (
              <div key={post.id} className="bg-[#122b1c] rounded-xl p-4 border border-[#295a3d] flex flex-col justify-between">
                
                {/* Post Author Card */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <img src={post.avatar} className="h-8 w-8 rounded-full object-cover border border-[#295a3d]" alt={`${post.author}'s avatar`} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs font-bold text-white">{post.author}</h5>
                          {isAuthor && (
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-stone-300">{post.date}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-[#42bd6c] bg-[#2d824d]/20 border border-[#2d824d]/40 px-2 py-0.5 rounded-full uppercase">
                      {post.category}
                    </span>
                  </div>

                  {/* Rating if present */}
                  {post.rating && (
                    <div className="flex items-center gap-1 mb-2.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={11} className={star <= (post.rating || 0) ? "fill-amber-400 text-amber-400" : "text-stone-800"} />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-amber-300 ml-1">{post.rating}/5</span>
                    </div>
                  )}

                  {/* Main Text */}
                  <p className="text-xs text-stone-200 leading-relaxed mb-3">
                    "{post.text}"
                  </p>

                  {/* Optional Attached Photo */}
                  {post.image && (
                    <img src={post.image} className="w-full h-40 object-cover rounded-lg border border-[#295a3d] mb-3" alt={`Community post media shared by ${post.author}`} />
                  )}
                </div>

                {/* Interaction Row */}
                <div className="flex justify-between items-center pt-2.5 border-t border-[#295a3d] mt-1 text-[11px] font-mono text-stone-300">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 hover:text-emerald-400 transition-all cursor-pointer"
                  >
                    <Heart size={12} className="fill-current text-stone-400 hover:text-emerald-400" />
                    <span>{post.likes} Likes</span>
                  </button>
                  <span className="text-[10px] text-[#42bd6c] flex items-center gap-1">
                    <CheckCircle2 size={11} /> Verified Review ✓
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
