export const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Filters", href: "/#filters" },
  { label: "Templates", href: "/#templates" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

export const FEATURES = [
  { title: "Live camera", text: "Front or rear camera, mirror view, and a 3, 5 or 10 second countdown." },
  { title: "Filters and adjustments", text: "Vintage to Y2K looks, each with an intensity slider, plus brightness, contrast and more." },
  { title: "Strips and collages", text: "Vertical strips, polaroids and collages built from your own shots." },
  { title: "Photo editor", text: "Crop, rotate, add text, emoji and stickers, with undo and redo." },
  { title: "Stickers and frames", text: "Decorations for birthdays, weddings, couples and everyday moments." },
  { title: "JPG and PNG export", text: "Download exactly what you see in the preview." },
  { title: "Private by design", text: "Photos are processed in your browser. Nothing is uploaded unless you say so." },
  { title: "Nothing to install", text: "Open the site on a phone or computer and start shooting." },
];

export type FilterCategory = "Vintage" | "Classic" | "Modern" | "Aesthetic" | "Artistic";
export type PhotoFilter = { id: string; name: string; category: FilterCategory; css: string };
export const FILTER_CATEGORIES: FilterCategory[] = ["Vintage", "Classic", "Modern", "Aesthetic", "Artistic"];
export const FILTERS: PhotoFilter[] = [
  { id: "vintage", name: "Vintage", category: "Vintage", css: "sepia(.35) contrast(1.05) saturate(1.3) hue-rotate(-8deg) brightness(.97)" },
  { id: "retro", name: "Retro", category: "Vintage", css: "sepia(.25) saturate(1.6) contrast(1.1) hue-rotate(-18deg)" },
  { id: "film", name: "Film", category: "Vintage", css: "contrast(1.15) saturate(.85) sepia(.15) brightness(1.02)" },
  { id: "polaroid", name: "Polaroid", category: "Vintage", css: "contrast(.95) brightness(1.1) saturate(1.2) sepia(.2)" },
  { id: "bw", name: "Black & White", category: "Classic", css: "grayscale(1) contrast(1.1)" },
  { id: "sepia", name: "Sepia", category: "Classic", css: "sepia(.9)" },
  { id: "soft-contrast", name: "Soft Contrast", category: "Classic", css: "contrast(.9) brightness(1.05) saturate(.9)" },
  { id: "cinematic", name: "Cinematic", category: "Modern", css: "contrast(1.2) saturate(.9) hue-rotate(-12deg) brightness(.92)" },
  { id: "warm", name: "Warm", category: "Modern", css: "sepia(.2) saturate(1.2) hue-rotate(-10deg) brightness(1.04)" },
  { id: "cool", name: "Cool", category: "Modern", css: "saturate(1.05) hue-rotate(15deg) brightness(1.03)" },
  { id: "natural", name: "Natural", category: "Modern", css: "contrast(1.04) saturate(1.06)" },
  { id: "y2k", name: "Y2K", category: "Aesthetic", css: "saturate(1.7) contrast(1.1) hue-rotate(10deg) brightness(1.08)" },
  { id: "dreamy", name: "Dreamy", category: "Aesthetic", css: "brightness(1.12) contrast(.88) saturate(1.2) blur(.6px)" },
  { id: "pastel", name: "Pastel", category: "Aesthetic", css: "saturate(.7) brightness(1.15) contrast(.9)" },
  { id: "soft-pink", name: "Soft Pink", category: "Aesthetic", css: "sepia(.3) hue-rotate(300deg) saturate(1.3) brightness(1.08)" },
  { id: "fade", name: "Fade", category: "Artistic", css: "contrast(.8) brightness(1.1) saturate(.8)" },
  { id: "high-contrast", name: "High Contrast", category: "Artistic", css: "contrast(1.5) saturate(1.2)" },
  { id: "soft-blur", name: "Soft Blur", category: "Artistic", css: "blur(1.2px) brightness(1.04)" },
];

export type TemplateLayout = "single" | "strip2" | "strip3" | "strip4" | "polaroid" | "collage";
export type Template = { id: string; name: string; category: string; layout: TemplateLayout; bg: string; ink: string; hues: number[] };
export const TEMPLATE_CATEGORIES = ["All", "Birthday", "Wedding", "Graduation", "Couple", "Friendship", "Party", "Family", "Corporate", "Travel", "Everyday"];
export const TEMPLATES: Template[] = [
  { id: "birthday", name: "Confetti Day", category: "Birthday", layout: "strip4", bg: "#FFE9A8", ink: "#7A3B00", hues: [330, 40, 200, 280] },
  { id: "wedding", name: "Ivory Vows", category: "Wedding", layout: "polaroid", bg: "#FBF7F0", ink: "#5C4B3A", hues: [20] },
  { id: "graduation", name: "Cap and Gown", category: "Graduation", layout: "strip3", bg: "#1E2A4A", ink: "#F3E3A3", hues: [220, 200, 240] },
  { id: "couple", name: "Two of Us", category: "Couple", layout: "strip2", bg: "#FFD3DC", ink: "#8A1F3A", hues: [340, 10] },
  { id: "friendship", name: "Squad Sheet", category: "Friendship", layout: "collage", bg: "#D9F0E4", ink: "#1E5A3F", hues: [160, 40, 200, 300, 90] },
  { id: "party", name: "After Dark", category: "Party", layout: "strip4", bg: "#1B1030", ink: "#FF8AD8", hues: [290, 330, 260, 310] },
  { id: "family", name: "Family Album", category: "Family", layout: "collage", bg: "#F5E6D3", ink: "#5A3B22", hues: [30, 10, 50, 340, 20] },
  { id: "corporate", name: "Clean Brand", category: "Corporate", layout: "single", bg: "#FFFFFF", ink: "#16131E", hues: [210] },
  { id: "travel", name: "Postcard", category: "Travel", layout: "polaroid", bg: "#DCEBFA", ink: "#1B4A7A", hues: [200] },
  { id: "everyday", name: "Plain Strip", category: "Everyday", layout: "strip3", bg: "#FFFFFF", ink: "#16131E", hues: [330, 200, 40] },
];

export type Plan = { id: string; name: string; price: number; tagline: string; features: string[]; cta: string };
export const PLANS: Plan[] = [
  { id: "free", name: "FREE", price: 0, tagline: "Try the full photobooth flow.", cta: "Start free", features: ["2 sessions per account, for the life of the account", "Up to 3 photos per session", "Basic camera and countdown", "Basic filters and free templates", "Basic photo strip and editor", "1 JPG download per session"] },
  { id: "standard", name: "STANDARD", price: 10000, tagline: "Unlimited sessions.", cta: "Get Standard", features: ["Unlimited photobooth sessions", "Extra filters and templates", "Extra stickers and frames", "Photo strips and collages", "Basic photo editor", "JPG and PNG export"] },
  { id: "premium", name: "PREMIUM", price: 19000, tagline: "More looks, more control.", cta: "Get Premium", features: ["Everything in Standard", "Premium filters", "Exclusive templates", "Premium stickers and frames", "Advanced photo editor", "Highest export quality your browser allows", "No watermark", "More customization"] },
  { id: "lifetime", name: "LIFETIME", price: 49000, tagline: "Everything, for good.", cta: "Get Lifetime", features: ["Everything in Premium", "All Lifetime-only features", "Extra customization", "Future updates that are listed as part of Lifetime"] },
];

export const HOW_IT_WORKS = [
  { title: "Open the studio", text: "No download. Allow camera access when your browser asks." },
  { title: "Pick a look", text: "Choose a filter and a template for your strip." },
  { title: "Snap with a countdown", text: "Take up to three shots and retake any you do not like." },
  { title: "Edit and download", text: "Add text or stickers, check the preview, then save your photo." },
];

export const FAQS = [
  { q: "Is PHOTOBOOTH STUDIO available to use yet?", a: "Yes, in early preview. Create an account to use your 2 free sessions. Some features are still being added." },
  { q: "What do I get for free?", a: "Every account will get 2 free sessions. One session is a full photobooth run: up to 3 photos, one finished strip and one JPG download. Free sessions do not reset." },
  { q: "Are my photos uploaded?", a: "No. Photos are meant to be processed in your browser and stay on your device. Anything that needs the cloud will ask for your permission first." },
  { q: "Do I pay monthly?", a: "No. Standard, Premium and Lifetime are one-time payments with no monthly or yearly fees. If you upgrade later, you pay the listed upgrade price instead of the full price." },
  { q: "Which devices work?", a: "Any modern phone or computer with a camera and an up-to-date browser. The camera needs a secure (HTTPS) connection, which the live site will use." },
  { q: "Will you add AI effects?", a: "They are planned, such as background removal. Anything not ready will be marked Coming Soon rather than shown as if it worked." },
];
