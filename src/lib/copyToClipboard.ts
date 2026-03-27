export async function copyTextToClipboard(text: string): Promise<boolean> {
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return false;
	}

	if (navigator.clipboard?.writeText && window.isSecureContext) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// Fall through to the synchronous fallback below.
		}
	}

	const textarea = document.createElement('textarea');
	textarea.value = text;
	textarea.setAttribute('readonly', 'true');
	textarea.style.position = 'fixed';
	textarea.style.top = '0';
	textarea.style.left = '0';
	textarea.style.opacity = '0';
	document.body.appendChild(textarea);

	const selection = document.getSelection();
	const originalRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

	textarea.focus();
	textarea.select();
	textarea.setSelectionRange(0, textarea.value.length);

	let copied = false;
	try {
		copied = document.execCommand('copy');
	} catch {
		copied = false;
	}

	document.body.removeChild(textarea);

	if (selection) {
		selection.removeAllRanges();
		if (originalRange) {
			selection.addRange(originalRange);
		}
	}

	return copied;
}
