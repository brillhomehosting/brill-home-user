'use client';

import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { getQueryClient } from './queryClient';
import { theme } from './theme';

// Import Mantine styles
import '@mantine/core/styles.css';

interface ProvidersProps {
	children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
	// NOTE: Avoid useState when initializing the query client if you don't
	// have a suspense boundary between this and the code that may
	// suspend because React will throw away the client on the initial
	// render if it suspends and there is no boundary
	const queryClient = getQueryClient();

	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider theme={theme} defaultColorScheme="auto">
				{children}
			</MantineProvider>
		</QueryClientProvider>
	);
}

// Export ColorSchemeScript for use in layout head
export { ColorSchemeScript };
