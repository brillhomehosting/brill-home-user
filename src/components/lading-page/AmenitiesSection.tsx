import { amenitiesData } from "@/data";
import { Card, Container, Stack, Text } from "@mantine/core";
import { motion } from "framer-motion";
import {
	AirVent,
	Droplets,
	Gamepad2,
	LucideIcon,
	MonitorPlay,
	PersonStanding,
	Refrigerator,
	Shirt,
	Wind,
} from "lucide-react";

// Icon mapping from string to component
const iconMap: Record<string, LucideIcon> = {
	AirVent,
	Droplets,
	Refrigerator,
	Shirt,
	PersonStanding,
	MonitorPlay,
	Wind,
	Gamepad2,
};

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.08 },
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5 },
	},
};

export function AmenitiesSection() {
	return (
		<section id="amenities" className="py-20 md:py-28 lg:py-32 bg-foreground">
			<Container size="xl">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-center mb-12 md:mb-16 px-4"
				>
					<span className="inline-block text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] text-[#d4af37] font-bold mb-3 md:mb-4">
						{amenitiesData.sectionLabel}
					</span>
					<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-snug md:leading-tight text-background mb-3 md:mb-4">
						{amenitiesData.title}
					</h2>
					<p className="text-background/80 max-w-xl md:max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
						{amenitiesData.description}
					</p>
				</motion.div>

				{/* Amenities Grid */}
				<motion.div
					variants={containerVariants}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true }}
					className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
				>
					{amenitiesData.items.map((amenity) => {
						const Icon = iconMap[amenity.icon];
						return (
							<motion.div key={amenity.title} variants={itemVariants}>
								<Card
									shadow="md"
									className="bg-background border border-foreground/5 h-full hover:border-primary transition-colors group"
								>
									<Stack gap="md">
										<div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center transition-all group-hover:bg-primary/20">
											{Icon && <Icon className="w-6 h-6 text-primary" />}
										</div>
										<Text size="lg" fw={500} className="font-serif text-foreground">
											{amenity.title}
										</Text>
										<Text size="sm" className="text-foreground/70">
											{amenity.description}
										</Text>
									</Stack>
								</Card>
							</motion.div>
						);
					})}
				</motion.div>
			</Container>
		</section>
	);
}
