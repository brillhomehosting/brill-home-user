import lineStoreImage from "@/assets/line-store.jpg";
import { aboutData } from "@/data";
import { Button, Card, Container, Group, Stack, Text } from "@mantine/core";
import { motion } from "framer-motion";
import { Leaf, LucideIcon, TreePine } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const iconMap: Record<string, LucideIcon> = {
	TreePine,
	Leaf,
};

export function AboutSection() {
	const router = useRouter();
	return (
		<section id="about" className="py-20 md:py-28 lg:py-32 bg-background overflow-hidden relative">
			<Container size="xl">
				<div className="grid lg:grid-cols-2 gap-16 items-center">
					{/* Image Side */}
					<motion.div
						initial={{ opacity: 0, x: -50 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.8 }}
						className="relative"
					>
						<div className="relative rounded-lg overflow-hidden w-full aspect-4/3">
							<Image
								src={lineStoreImage}
								alt="Brill Home Resort Overview"
								fill
								sizes="(max-width: 768px) 100vw, 50vw"
								className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
							/>
							<div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
						</div>

						{/* Stats Overlay */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6, delay: 0.3 }}
						>
							<Card
								shadow="xl"
								style={{
									position: 'absolute',
								}}
								className="-bottom-8 left-8 right-8 border border-foreground/5 bg-secondary"
							>
								<Group grow>
									{aboutData.features.map((feature) => {
										const Icon = iconMap[feature.icon];
										return (
											<Group key={feature.label} gap="sm"  wrap="nowrap">
												<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
													{Icon && <Icon className="w-5 h-5 text-primary" />}
												</div>
												<Stack gap={2}>
													<Text fw={600} className="text-foreground">{feature.label}</Text>
													<Text size="xs" c="dimmed">{feature.sublabel}</Text>
												</Stack>
											</Group>
										);
									})}
								</Group>
							</Card>
						</motion.div>
					</motion.div>

					{/* Content Side */}
					<motion.div
						initial={{ opacity: 0, x: 50 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.8 }}
						className="lg:pl-8 pt-16 lg:pt-0"
					>
						<span className="inline-block text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] text-[#d4af37] font-bold mb-3 md:mb-4">
							{aboutData.sectionLabel}
						</span>
						<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-snug md:leading-tight text-foreground mb-4 md:mb-6">
							{aboutData.title}
						</h2>

						<p className="text-foreground/80 leading-relaxed text-sm md:text-base mb-6">
							{aboutData.description}
						</p>

						<Stack gap="md" className="mb-8">
							<div>
								<Text fw={500} className="text-primary mb-1">{aboutData.vision.title}</Text>
								<Text size="sm" c="dimmed">
									{aboutData.vision.content}
								</Text>
							</div>
							<div>
								<Text fw={500} className="text-primary mb-1">{aboutData.mission.title}</Text>
								<Text size="sm" c="dimmed">
									{aboutData.mission.content}
								</Text>
							</div>
						</Stack>

						<Button
							onClick={() => router.push('/blogs/line-store')}
							styles={{
								root: {
									backgroundColor: '#D97D48',
									color: '#fff',
									'&:hover': {
										backgroundColor: '#D97D48',
										color: '#fff',
									},
								},
							}}
						>
							{aboutData.ctaButton}
						</Button>
					</motion.div>
				</div>
			</Container>
		</section>
	);
}
