import React from 'react';
import { ThemeProvider, jetpackTheme, wooTheme } from '../providers/theme';

/**
 * Shared legend configuration for chart stories
 * Provides consistent argTypes and decorators across all chart legend stories
 */
export const legendArgTypes = {
	legendAlign: {
		control: 'select',
		options: [ 'left', 'center', 'right' ],
	},
	legendVerticalAlign: {
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