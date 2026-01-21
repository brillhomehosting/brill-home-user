import { faqData } from "@/data";
import { Accordion, Container } from "@mantine/core";
import { motion } from "framer-motion";

export function FAQSection() {
	return (
		<section className="py-20 md:py-28 lg:py-32 bg-background relative">
			<Container size="xl">
				<div className="grid lg:grid-cols-2 gap-16 items-start">
					{/* Left Side */}
					<motion.div
						initial={{ opacity: 0, x: -30 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="lg:sticky lg:top-32"
					>
						<span className="inline-block text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] text-[#d4af37] font-bold mb-3 md:mb-4">
							{faqData.sectionLabel}
						</span>
						<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-snug md:leading-tight text-foreground mb-4 md:mb-6">
							{faqData.title}
						</h2>
						<p className="text-foreground/70 leading-relaxed text-sm md:text-base mb-6 md:mb-8">
							{faqData.description}
						</p>
					</motion.div>

					{/* FAQ Accordion */}
					<motion.div
						initial={{ opacity: 0, x: 30 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.2 }}
					>
						<Accordion
							variant="separated"
							styles={{
								item: {
									backgroundColor: 'var(--secondary)',
									border: '1px solid rgba(62, 44, 36, 0.05)',
									'&[dataActive]': {
										borderColor: 'var(--primary)',
									},
								},
								control: {
									'&:hover': {
										backgroundColor: 'transparent',
									},
								},
								label: {
									fontFamily: 'Cormorant Garamond, Georgia, serif',
									fontSize: '1.125rem',
									color: 'var(--foreground)',
								},
								content: {
									color: 'rgba(62, 44, 36, 0.8)',
								},
								chevron: {
									color: 'var(--primary)',
								},
							}}
						>
							{faqData.items.map((faq, index) => (
								<Accordion.Item key={index} value={`item-${index}`}>
									<Accordion.Control>{faq.question}</Accordion.Control>
									<Accordion.Panel>{faq.answer}</Accordion.Panel>
								</Accordion.Item>
							))}
						</Accordion>
					</motion.div>
				</div>
			</Container>
		</section>
	);
}
