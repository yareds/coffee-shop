import { Router } from "express";
import { getProfile, saveProfile, addActivityLog } from "../db.js";

const router = Router();

export const ethiopianRegions = [
  {
    id: "r1",
    name: "Yirgacheffe",
    elevation: "1,900m - 2,200m",
    process: "Washed / Natural",
    notes: ["Jasmine", "Citrus", "Bergamot", "Lemon Tea", "Peach"],
    farmer: "Abebech & family, Yirgacheffe Specialty Highlands",
    history: "Nestled in the Gedeo zone, Yirgacheffe is globally renowned for producing pristine, floral, and tea-like coffees. It is considered the birthplace of washed coffee processes in Ethiopia.",
    drinks: ["Yirgacheffe Pour Over", "Iced Citrus Brew"],
    badgeName: "Yirgacheffe Lover",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "r2",
    name: "Sidama",
    elevation: "1,500m - 2,200m",
    process: "Natural / Washed",
    notes: ["Blueberry", "Citrus", "Floral", "Red Honey"],
    farmer: "Demeke Alamu, Sidama Highland Co-operative",
    history: "Sidama coffees are grown in expansive highland valleys. They are celebrated for their fruit-forward profile, deep sweetness, crisp citric acidity, and rich texture.",
    drinks: ["Sidama Natural Hand-Brew", "Sidama Espresso"],
    badgeName: "Sidama Explorer",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "r3",
    name: "Guji",
    elevation: "1,800m - 2,100m",
    process: "Natural / Honey",
    notes: ["Wild Strawberry", "Peach", "Chocolate", "Honey Cream"],
    farmer: "Zenabu Tsegaye, Guji Forest Canopy Growers",
    history: "Guji's unique microclimate and dense forest soil yield remarkably sweet, complex cup profiles. Once grouped under Sidamo, it is now celebrated as a standalone premier origin.",
    drinks: ["Guji Nitro Cold Brew", "Guji AeroPress Cup"],
    badgeName: "Guji Adventurer",
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "r4",
    name: "Harrar",
    elevation: "1,500m - 2,100m",
    process: "Dry-Processed (Natural)",
    notes: ["Blueberry", "Wine-like Acid", "Dark Chocolate", "Blackberry"],
    farmer: "Tadesse Kebede, Eastern Harrar Hills",
    history: "One of the oldest coffee-growing regions in the world, Harrar yields highly distinctive, wild, winy, and complex dry-processed beans with rich chocolate undertones.",
    drinks: ["Traditional Jebena Brew (Abol)", "Harrar Double Shot"],
    badgeName: "Harrar Expert",
    image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "r5",
    name: "Limu",
    elevation: "1,400m - 1,900m",
    process: "Washed",
    notes: ["Black Tea", "Orange Peel", "Sweet Caramel", "Jasmine"],
    farmer: "Mulatu Chala, Limu Organic Growers Association",
    history: "Limu coffees are grown in southwest highlands. They are well-balanced with a round body, delicate floral notes, and clean citrus notes.",
    drinks: ["Limu Pour Over", "Limu French Press"],
    badgeName: "Limu Enthusiast",
    image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "r6",
    name: "Jimma",
    elevation: "1,400m - 2,000m",
    process: "Natural / Washed",
    notes: ["Caramel Cream", "Toasted Almond", "Milk Chocolate", "Low Acid"],
    farmer: "Fikru Hailu, Kossa Geshe Estates",
    history: "Historically famous for bulk natural coffees, Jimma now boasts incredible specialty farms producing rich, chocolatey, low-acid beans ideal for rich espressos.",
    drinks: ["Jimma Macchiato", "Traditional Jebena Brew (Tona)"],
    badgeName: "Jimma Pioneer",
    image: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500&auto=format&fit=crop&q=60"
  }
];

router.get("/regions", (req, res) => {
  res.json(ethiopianRegions);
});

router.post("/stamp", async (req, res) => {
  try {
    const { regionName } = req.body;
    const region = ethiopianRegions.find(r => r.name.toLowerCase() === (regionName || "").toLowerCase());

    if (!region) {
      return res.status(404).json({ error: "Region not found" });
    }

    const profile = await getProfile(req);
    if (!profile.passportStamps.includes(region.name)) {
      profile.passportStamps.push(region.name);
      profile.points += 50;

      if (!profile.unlockedBadges.includes(region.badgeName)) {
        profile.unlockedBadges.push(region.badgeName);
      }

      if (
        profile.passportStamps.length === ethiopianRegions.length &&
        !profile.unlockedBadges.includes("Ethiopian Coffee Master")
      ) {
        profile.unlockedBadges.push("Ethiopian Coffee Master");
        profile.points += 200;
      }

      await saveProfile(profile);
      await addActivityLog(`Stamped coffee passport for ${region.name}! (+50 pts)`);
    }

    res.json({ success: true, loyalty: profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to stamp passport" });
  }
});

export default router;
