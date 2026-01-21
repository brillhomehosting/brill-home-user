import landingPageData from "./landing-page-data.json";

// Import room images from assets
import phong1 from "@/assets/phong1.jpg";
import phong2 from "@/assets/phong2.jpg";
import phong3 from "@/assets/phong3.jpg";
import phong4 from "@/assets/phong4.jpg";
import phong5 from "@/assets/phong5.jpg";

// Create image mapping
const imageMapping: Record<string, any> = {
	"@/assets/phong1.jpg": phong1,
	"@/assets/phong2.jpg": phong2,
	"@/assets/phong3.jpg": phong3,
	"@/assets/phong4.jpg": phong4,
	"@/assets/phong5.jpg": phong5,
};

// Helper function to resolve image paths
function resolveImagePath(path: string) {
	return imageMapping[path] || path;
}

// Process rooms data to resolve image paths
const processedRoomsData = {
	...landingPageData.rooms,
	items: landingPageData.rooms.items.map((room) => ({
		...room,
		images: room.images.map((img) => ({
			...img,
			url: resolveImagePath(img.url),
		})),
	})),
};

// Export typed data
export const heroData = landingPageData.hero;
export const roomsData = processedRoomsData; // Use processed data with resolved images
export const amenitiesData = landingPageData.amenities;
export const galleryData = landingPageData.gallery;
export const testimonialsData = landingPageData.testimonials;
export const aboutData = landingPageData.about;
export const faqData = landingPageData.faq;
export const contactData = landingPageData.contact;
export const mapData = landingPageData.map;

export default landingPageData;
