export default function LoadingSkeleton() {
	return (
		<div className="animate-pulse p-4">
			<div className="flex gap-2">
				<div className="shrink-0">
					<div className="h-6 w-20 bg-muted/50 rounded mb-2" />
					{Array.from({ length: 7 }).map((_, i) => (
						<div key={i} className="h-10 w-24 bg-muted/30 rounded mb-1" />
					))}
				</div>
				<div className="flex gap-4 overflow-hidden">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i}>
							<div className="h-6 w-[260px] bg-muted/50 rounded mb-2" />
							{Array.from({ length: 7 }).map((_, j) => (
								<div key={j} className="flex gap-1 mb-1">
									{Array.from({ length: 4 }).map((_, k) => (
										<div key={k} className="h-10 w-[70px] bg-muted/30 rounded" />
									))}
								</div>
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
