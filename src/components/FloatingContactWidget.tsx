'use client';

import messengerIcon from '@/assets/icon-messenger.png';
import zaloIcon from '@/assets/icon-zalo.png';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Phone, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import {contactData} from '@/data/contact-data'


export default function FloatingContactWidget() {
	const [isOpen, setIsOpen] = useState(true);

	const handleMessengerClick = () => {
		window.open(`https://m.me/${contactData.facebookPageId}`, '_blank');
	};

	const handleZaloClick = () => {
		window.open(`https://zalo.me/${contactData.phoneNumber}`, '_blank');
	};

	const handlePhoneClick = () => {
		window.location.href = `tel:${contactData.phoneNumber}`;
	};

	// Bounce animation
	const bounceAnimation = {
		y: [0, -8, 0],
		transition: {
			duration: 1.5,
			repeat: Infinity,
			ease: 'easeInOut' as const,
		},
	};

	return (
		<div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
			{/* Contact Icons */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ duration: 0.15 }}
						className="flex flex-col items-center gap-3"
					>
						{/* Messenger Button - Blue */}
						<motion.button
							animate={bounceAnimation}
							onClick={handleMessengerClick}
							className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer overflow-hidden"
							style={{
								boxShadow: '0 4px 15px rgba(0, 153, 255, 0.4)',
							}}
							title="Chat Messenger"
						>
							<Image src={messengerIcon} alt="Messenger" width={36} height={36} />
						</motion.button>

						{/* Zalo Button */}
						<motion.button
							animate={{
								...bounceAnimation,
								transition: { ...bounceAnimation.transition, delay: 0.2 },
							}}
							onClick={handleZaloClick}
							className="w-14 h-14 rounded-full bg-[#0068FF] flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer overflow-hidden"
							style={{
								boxShadow: '0 4px 15px rgba(0, 104, 255, 0.4)',
							}}
							title="Chat Zalo"
						>
							<Image src={zaloIcon} alt="Zalo" width={36} height={36} />
						</motion.button>

						{/* Phone Button - Green */}
						<motion.button
							animate={{
								...bounceAnimation,
								transition: { ...bounceAnimation.transition, delay: 0.1 },
							}}
							onClick={handlePhoneClick}
							className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
							style={{
								boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
							}}
							title="Gọi điện"
						>
							<Phone className="w-7 h-7" />
						</motion.button>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Toggle Button */}
			<motion.button
				onClick={() => setIsOpen(!isOpen)}
				className={`w-10 h-10 rounded-full bg-[#D97D48] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer ${isOpen ? 'rotate-90' : ''}`}
				style={{
					boxShadow: '0 4px 15px rgba(217, 125, 72, 0.4)',
				}}
				whileTap={{ scale: 0.9 }}
			>
				{isOpen ? (
					<X className="w-6 h-6" />
				) : (
					<MessageCircle className="w-6 h-6" />
				)}
			</motion.button>
		</div>
	);
}
