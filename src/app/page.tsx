'use client';

import { AboutSection } from '@/components/lading-page/AboutSection';
import AllRoomsBookingSection from '@/components/lading-page/AllRoomsBookingSection';
import { AmenitiesSection } from '@/components/lading-page/AmenitiesSection';
import { ContactSection } from '@/components/lading-page/ContactSection';
import { HeroSection } from '@/components/lading-page/HeroSection';
import { MapSection } from '@/components/lading-page/MapSection';
import { RoomsSection } from '@/components/lading-page/RoomsSection';



export default function HomePage() {
	return (
		<div className="w-full">
			<HeroSection />
			<RoomsSection />
			<AllRoomsBookingSection />
			<AboutSection />
			<AmenitiesSection />
			{/* <GallerySection /> */}
			{/* <TestimonialsSection /> */}
			{/* <FAQSection /> */}
			<MapSection />
			<ContactSection />
		</div>
	);
}
