import { ThemeProvider, jetpackTheme, wooTheme } from '../providers/theme';
import type { ChartTheme } from '../types';
import type { Decorator } from '@storybook/react';

/**
 * Shared legend configuration for chart stories
 * Provides consistent argTypes and decorators across all chart legend stories
 */
export const legendArgTypes = {
	showLegend: {
		control: 'boolean',
		table: { category: 'Legend' },
	},
	legendAlignmentHorizontal: {
		control: 'select',
		options: [ 'left', 'center', 'right' ],
		table: { category: 'Legend' },
	},
	legendAlignmentVertical: {
		control: 'select',
		options: [ 'top', 'bottom' ],
		table: { category: 'Legend' },
	},
	legendOrientation: {
		control: 'select',
		options: [ 'horizontal', 'vertical' ],
		table: { category: 'Legend' },
	},
	legendShape: {
		control: 'select',
		options: [ 'circle', 'rect' ],
		table: { category: 'Legend' },
	},
	withLegendGlyph: {
		control: 'boolean',
		table: { category: 'Legend' },
		description: 'Show glyphs in legend (Line charts only)',
	},
	theme: {
		control: 'select',
		options: {
			default: undefined,
			jetpack: jetpackTheme,
			woo: wooTheme,
		},
		defaultValue: undefined,
		table: { category: 'Theme' },
	},
};

/**
 * Shared decorator for legend stories with theme support and resizable container
 * @param Story      - The story component to render
 * @param root0      - The story context object
 * @param root0.args - The story arguments
 * @return The decorated story component
 */
export const legendDecorator: Decorator[] = [
	( Story, { args } ) => (
		<ThemeProvider theme={ args.theme as ChartTheme | undefined }>
			<div
				style={ {
					resize: 'both',
					overflow: 'auto',
					padding: '2rem',
					width: '800px',
					height: '600px',
					minWidth: '400px',
					maxWidth: '1200px',
					border: '1px dashed #ccc',
				} }
			>
				<Story />
			</div>
		</ThemeProvider>
	),
];
