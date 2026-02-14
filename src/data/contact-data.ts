import { Facebook, Instagram } from "lucide-react";

export const contactData = {
  facebookPageId: process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID || "875944355612197",
  phoneNumber: process.env.NEXT_PUBLIC_PHONE_NUMBER || "0939293804",
  email: "brillhomestay@gmail.com"
};

export const socialLinks = [
	{
		icon: Facebook,
		href: `https://www.facebook.com/profile.php?id=${contactData.facebookPageId}`,
		label: "Facebook",
	},
	{
		icon: "zalo",
		href: `https://zalo.me/${contactData.phoneNumber}`,
		label: "Zalo",
	},
	{
		icon: "tiktok",
		href: "https://www.tiktok.com/@brillhome26",
		label: "TikTok",
	},
	{
		icon: Instagram,
		href: "https://www.instagram.com/brillhomestay",
		label: "Instagram",
	},
];
