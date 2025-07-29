import { ThemeProvider } from '../providers/theme';
import type { ChartTheme } from '../types';
import type { Decorator } from '@storybook/react';

type Resize = 'both' | 'horizontal' | 'vertical' | 'none';

/**
 * Shared decorator for legend stories with theme support and resizable container
 * @param Story      - The story component to render
 * @param root0      - The story context object
 * @param root0.args - The story arguments
 * @return The decorated story component
 */
export const sharedDecorator: Decorator[] = [
	( Story, { args } ) => (
		<ThemeProvider theme={ args.theme as ChartTheme | undefined }>
			<div
				style={ {
					resize: ( args.resize as Resize ) ?? 'both',
					overflow: 'auto',
					padding: '1rem',
					width: ( args.containerWidth as string ) ?? '800px',
					height: ( args.containerHeight as string ) ?? '600px',
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
