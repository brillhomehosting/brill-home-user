import phong3Image from "@/assets/phong3.jpg";
import { contactData } from "@/data";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Container, Group, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";

const contactSchema = z.object({
	name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(100, "Tên không được quá 100 ký tự"),
	email: z.string().email("Vui lòng nhập email hợp lệ"),
	phone: z.string().optional(),
	message: z.string().min(10, "Tin nhắn phải có ít nhất 10 ký tự").max(1000, "Tin nhắn không được quá 1000 ký tự"),
});

type ContactFormData = z.infer<typeof contactSchema>;

// Mock API submission
const submitContact = async (values: ContactFormData): Promise<{ success: boolean }> => {
	// Simulate network request using the data
	console.log("Submitting:", values);
	await new Promise((resolve) => setTimeout(resolve, 1500));
	return { success: true };
};

export function ContactSection() {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ContactFormData>({
		resolver: zodResolver(contactSchema),
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			message: "",
		},
	});

	const mutation = useMutation({
		mutationFn: submitContact,
		onSuccess: () => {
			reset();
		},
	});

	const onSubmit = (values: ContactFormData) => {
		mutation.mutate(values);
	};

	return (
		<section id="contact" className="py-20 md:py-28 lg:py-32 bg-foreground relative">
			<Container size="xl">
				{/* ... */}
				{/* (Keeping structure, just targeting section mostly, but Card is deep) */}
				<div className="grid lg:grid-cols-2 gap-16 items-center">
					{/* Image Side */}
					<motion.div
						initial={{ opacity: 0, x: -50 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.8 }}
						className="relative hidden lg:block"
					>
						<div className="rounded-lg overflow-hidden relative w-full aspect-4/5">
							<Image
								src={phong3Image}
								alt="Brill Home Spa Experience"
								fill
								className="object-cover"
							/>
						</div>

						{/* Contact Card Overlay */}
						<Card
							shadow="xl"
							style={{
								position: 'absolute',
							}}
							className="-bottom-8 -right-8 border border-foreground/10 bg-background max-w-xs"
						>
							<Stack gap="md">
								<Text size="xl" fw={500} className="font-serif text-foreground!">
									Thông tin liên hệ
								</Text>
								<Stack gap="sm">
									<Group gap="sm">
										<Phone className="w-4 h-4 text-primary" />
										<Text size="sm" c="dimmed" className="text-foreground/80">{contactData.contactInfo.phone}</Text>
									</Group>
									<Group gap="sm">
										<Mail className="w-4 h-4 text-primary" />
										<Text size="sm" c="dimmed" className="text-foreground/80">{contactData.contactInfo.email}</Text>
									</Group>
									<Group gap="sm" wrap="nowrap" align="flex-start">
										<MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
										<Text size="sm" c="dimmed" className="text-foreground/80">{contactData.contactInfo.address}</Text>
									</Group>
								</Stack>
							</Stack>
						</Card>
					</motion.div>

					{/* Form Side */}
					<motion.div
						initial={{ opacity: 0, x: 50 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.8 }}
					>
						<span className="inline-block text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] text-[#d4af37] font-bold mb-3 md:mb-4">
							Liên hệ
						</span>
						<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-snug md:leading-tight text-background mb-3 md:mb-4">
							{contactData.title}
						</h2>
						<p className="text-background/80 leading-relaxed text-sm md:text-base mb-6 md:mb-8 whitespace-pre-line">
							{contactData.description}
						</p>

						{mutation.isSuccess && (
							<Card className="border border-green-700 mb-6 bg-secondary/20">
								<Text c="green">
									Đã gửi! Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất.
								</Text>
							</Card>
						)}

						<form onSubmit={handleSubmit(onSubmit)}>
							<Stack gap="md">
								<Group grow>
									<TextInput
										label="Họ và tên"
										placeholder="Tên của bạn"
										error={errors.name?.message}
										{...register("name")}
										styles={{
											input: {
												backgroundColor: '#fff',
												borderColor: 'rgba(62, 44, 36, 0.1)',
												color: '#3E2C24',
												'&:focus': {
													borderColor: '#D97D48',
												},
											},
											label: {
												color: 'var(--foreground)',
												marginBottom: 8,
											},
											error: {
												color: '#ff6b6b'
											}
										}}
									/>
									<TextInput
										label="Email"
										type="email"
										placeholder="your@email.com"
										error={errors.email?.message}
										{...register("email")}
										styles={{
											input: {
												backgroundColor: '#fff',
												borderColor: 'rgba(62, 44, 36, 0.1)',
												color: '#3E2C24',
												'&:focus': {
													borderColor: '#D97D48',
												},
											},
											label: {
												color: 'var(--foreground)',
												marginBottom: 8,
											},
											error: {
												color: '#ff6b6b'
											}
										}}
									/>
								</Group>

								<TextInput
									label="Số điện thoại (Tùy chọn)"
									placeholder="+84 123 456 789"
									error={errors.phone?.message}
									{...register("phone")}
									styles={{
										input: {
											backgroundColor: '#fff',
											borderColor: 'rgba(62, 44, 36, 0.1)',
											color: '#3E2C24',
											'&:focus': {
												borderColor: '#D97D48',
											},
										},
										label: {
											color: 'var(--foreground)',
											marginBottom: 8,
										},
										error: {
											color: '#ff6b6b'
										}
									}}
								/>

								<Textarea
									label="Tin nhắn"
									placeholder="Hãy cho chúng tôi biết về kỳ nghỉ mơ ước của bạn..."
									rows={5}
									error={errors.message?.message}
									{...register("message")}
									styles={{
										input: {
											backgroundColor: '#fff',
											borderColor: 'rgba(62, 44, 36, 0.1)',
											color: '#3E2C24',
											'&:focus': {
												borderColor: '#D97D48',
											},
											fontSize: '16px',
										},
										label: {
											color: 'var(--foreground)',
											marginBottom: 8,
											fontSize: '16px',
										},
										error: {
											color: '#ff6b6b'
										}
									}}
								/>

								<Button
									type="submit"
									size="lg"
									fullWidth
									loading={mutation.isPending}
									leftSection={!mutation.isPending && <Send size={18} />}
									styles={{
										root: {
											backgroundColor: '#D97D48',
											color: '#fff',
											'&:hover': {
												backgroundColor: '#c46d38'
											}
										}
									}}
								>
									{mutation.isPending ? "Đang gửi..." : "Gửi tin nhắn"}
								</Button>
							</Stack>
						</form>
					</motion.div>
				</div>
			</Container>
		</section>
	);
}
