import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useState, type RefObject } from "react";

const OVERSCAN_ROWS = 6;
const LOAD_AHEAD_ROWS = 15;

/** Renders only the visible calendar rows and asks for more data near the end. */
export function useCalendarVirtualRows({
	scrollRef,
	headerRef,
	rowCount,
	footerRows,
	defaultRowHeight,
	canLoadMore,
	onNearEnd,
}: {
	scrollRef: RefObject<HTMLDivElement | null>;
	headerRef: RefObject<HTMLTableSectionElement | null>;
	rowCount: number;
	footerRows: number;
	defaultRowHeight: number;
	canLoadMore: boolean;
	onNearEnd: () => void;
}) {
	const [rowHeight, setRowHeight] = useState(defaultRowHeight);
	const [headerHeight, setHeaderHeight] = useState(0);

	const virtualizer = useVirtualizer({
		count: rowCount + footerRows,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => rowHeight,
		overscan: OVERSCAN_ROWS,
		scrollMargin: headerHeight,
		useFlushSync: false,
	});

	useEffect(() => {
		virtualizer.measure();
	}, [rowHeight, headerHeight, virtualizer]);

	const items = virtualizer.getVirtualItems();
	const hasRenderedRows = rowCount > 0 && items.length > 0;

	// All rows share one height per breakpoint, so measuring a single row is enough.
	useLayoutEffect(() => {
		const measure = () => {
			const box = scrollRef.current;
			if (!box) return;
			const row = box.querySelector<HTMLElement>("tr[data-date]");
			if (row) setRowHeight(row.getBoundingClientRect().height);
			if (headerRef.current) setHeaderHeight(headerRef.current.getBoundingClientRect().height);
		};
		measure();
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, [scrollRef, headerRef, hasRenderedRows]); // eslint-disable-line react-hooks/exhaustive-deps

	const lastIndex = items[items.length - 1]?.index ?? 0;
	const hasScrolled = (virtualizer.scrollOffset ?? 0) > 0;

	useEffect(() => {
		if (canLoadMore && hasScrolled && lastIndex >= rowCount - LOAD_AHEAD_ROWS) onNearEnd();
	}, [canLoadMore, hasScrolled, lastIndex, rowCount, onNearEnd]);

	const paddingTop = items.length ? items[0]!.start - headerHeight : 0;
	const paddingBottom = items.length
		? virtualizer.getTotalSize() - (items[items.length - 1]!.end - headerHeight)
		: 0;

	const firstVisibleIndex = items.find((item) => item.end > (virtualizer.scrollOffset ?? 0) + headerHeight)?.index ?? 0;

	return { items, paddingTop, paddingBottom, firstVisibleIndex, scrollToStart: () => virtualizer.scrollToOffset(0) };
}
