import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

dotenv.config();

async function cleanupCommunityPostsAuthorEmails() {
  console.log("[Cleanup] Starting cleanup of authorEmail fields from community_posts...");

  let targetProjectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  let targetDatabaseId: string | undefined;

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (!targetProjectId && config.projectId) {
        targetProjectId = config.projectId;
      }
      if (config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)") {
        targetDatabaseId = config.firestoreDatabaseId;
      }
    }
  } catch (err) {
    console.warn("[Cleanup] Could not read firebase-applet-config.json:", err);
  }

  const app = !getApps().length
    ? initializeApp({ projectId: targetProjectId || "buna-ethiopia" })
    : getApps()[0];

  const db = targetDatabaseId ? getFirestore(app, targetDatabaseId) : getFirestore(app);

  try {
    const postsRef = db.collection("community_posts");
    const snapshot = await postsRef.get();

    if (snapshot.empty) {
      console.log("[Cleanup] community_posts collection is empty or does not exist yet.");
      return;
    }

    console.log(`[Cleanup] Found ${snapshot.size} total documents in community_posts. Scanning for authorEmail...`);

    let cleanedCount = 0;
    const batch = db.batch();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if ("authorEmail" in data) {
        console.log(`[Cleanup] Removing authorEmail from document ${doc.id}`);
        batch.update(doc.ref, {
          authorEmail: FieldValue.delete()
        });
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      await batch.commit();
      console.log(`[Cleanup] Successfully removed authorEmail from ${cleanedCount} document(s).`);
    } else {
      console.log("[Cleanup] No documents contained authorEmail. Everything is clean.");
    }
  } catch (err: any) {
    console.error("[Cleanup] Firestore operation encountered error or fallback:", err.message || err);
    console.log("[Cleanup] Script finished check.");
  }
}

cleanupCommunityPostsAuthorEmails().then(() => {
  console.log("[Cleanup] Done.");
  process.exit(0);
}).catch((err) => {
  console.error("[Cleanup Fatal Error]:", err);
  process.exit(0);
});
