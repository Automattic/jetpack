import React from 'react';
import { ThemeProvider, jetpackTheme, wooTheme } from '../providers/theme';

/**
 * Shared legend configuration for chart stories
 * Provides consistent argTypes and decorators across all chart legend stories
 */
export const legendArgTypes = {
	legendAlignmentHorizontal: {
		control: 'select',
		options: [ 'left', 'center', 'right' ],
	},
	legendAlignmentVertical: {
		control: 'select',
		options: [ 'top', 'bottom' ],
	},
	legendOrientation: {
		control: 'select',
		options: [ 'horizontal', 'vertical' ],
	},
	theme: {
		control: 'select',
		options: {
			default: undefined,
			jetpack: jetpackTheme,
			woo: wooTheme,
		},
		defaultValue: undefined,
	},
};

/**
 * Shared decorator for legend stories with theme support and resizable container
 * @param Story      - The story component to render
 * @param root0      - The story context object
 * @param root0.args - The story arguments
 * @return The decorated story component
 */
export const legendDecorator = [
	( Story, { args } ) => (
		<ThemeProvider theme={ args.theme }>
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
