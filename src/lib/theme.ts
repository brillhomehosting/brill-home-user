"use client";

import { createTheme, MantineColorsTuple } from "@mantine/core";

// Custom primary color palette
const primaryColor: MantineColorsTuple = [
	"#e6f7ff",
	"#bae7ff",
	"#91d5ff",
	"#69c0ff",
	"#40a9ff",
	"#1890ff",
	"#096dd9",
	"#0050b3",
	"#003a8c",
	"#002766",
];

// Custom secondary color
const secondaryColor: MantineColorsTuple = [
	"#f0fdf4",
	"#dcfce7",
	"#bbf7d0",
	"#86efac",
	"#4ade80",
	"#22c55e",
	"#16a34a",
	"#15803d",
	"#166534",
	"#14532d",
];

export const theme = createTheme({
	// Color scheme
	primaryColor: "primary",
	colors: {
		primary: primaryColor,
		secondary: secondaryColor,
	},

	// Typography
	fontFamily:
		"Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
	fontFamilyMonospace:
		"JetBrains Mono, Menlo, Monaco, Courier New, monospace",
	headings: {
		fontFamily:
			"Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
		fontWeight: "600",
	},

	// Radius
	defaultRadius: "md",
	radius: {
		xs: "0.125rem",
		sm: "0.25rem",
		md: "0.5rem",
		lg: "1rem",
		xl: "2rem",
	},

	// Spacing
	spacing: {
		xs: "0.5rem",
		sm: "0.75rem",
		md: "1rem",
		lg: "1.5rem",
		xl: "2rem",
	},

	// Shadows
	shadows: {
		xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
		sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
		md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
		lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
		xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
	},

	// Component overrides
	components: {
		Button: {
			defaultProps: {
				size: "md",
			},
			styles: {
				root: {
					fontWeight: 500,
				},
			},
		},
		Card: {
			defaultProps: {
				shadow: "sm",
				padding: "lg",
				radius: "md",
				withBorder: true,
			},
		},
		TextInput: {
			defaultProps: {
				size: "md",
			},
		},
		Select: {
			defaultProps: {
				size: "md",
			},
		},
	},

	// Other settings
	cursorType: "pointer",
	focusRing: "auto",
	scale: 1,
});
