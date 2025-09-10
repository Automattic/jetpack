import { GlobalChartsProvider } from '../providers';
import { CHART_THEME_MAP } from './theme-config';
import type { Decorator } from '@storybook/react';

/**
 * Generic StoryArgs type that extends any chart component props with themeName
 * This can be used by all chart stories to ensure consistent theming support
 */
export type ChartStoryArgs< T = Record< string, unknown > > = T & {
	themeName?: string;
	containerWidth?: string;
	containerHeight?: string;
	resize?: 'none' | 'both' | 'horizontal' | 'vertical';
};

/**
 * Shared decorator for chart stories with GlobalChartsProvider and dynamic theme support
 * Provides a resizable container for testing responsive behavior
 * Composes with simpleChartDecorator to add container styling
 * Supports configurable container dimensions via containerWidth/containerHeight args
 * @param Story   - The story component to render
 * @param context - The full story context object
 * @return The decorated story component wrapped in GlobalChartsProvider and container
 */
export const chartDecorator: Decorator = ( Story, context ) => {
	const args = context.args as ChartStoryArgs;

	const StoryWithContainer = () => (
		<div
			style={ {
				resize: args.resize || 'both',
				overflow: 'auto',
				padding: '1rem',
				width: args.containerWidth || '800px',
				height: args.containerHeight,
				maxWidth: '1200px',
				border: '1px dashed #ccc',
				display: 'inline-block',
			} }
		>
			<Story />
		</div>
	);

	return simpleChartDecorator( StoryWithContainer, context );
};

/**
 * Simple decorator for chart context stories with GlobalChartsProvider but no container styling
 * Used for stories that display multiple charts in custom layouts
 * @param Story      - The story component to render
 * @param root0      - The story context object
 * @param root0.args - The story arguments
 * @return The story component wrapped in GlobalChartsProvider only
 */
export const simpleChartDecorator: Decorator = ( Story, { args } ) => {
	const themeName = ( args as unknown as ChartStoryArgs ).themeName;
	const theme = CHART_THEME_MAP[ themeName || 'default' ];

	return (
		<GlobalChartsProvider theme={ theme }>
			<Story />
		</GlobalChartsProvider>
	);
};

/**
 * Shared argTypes for common chart controls
 */
export const sharedChartArgTypes = {
	maxWidth: {
		control: {
			type: 'number',
			min: 100,
			max: 1200,
		},
	},
	aspectRatio: {
		control: {
			type: 'number',
			min: 0,
			max: 1,
		},
	},
	resizeDebounceTime: {
		control: {
			type: 'number',
			min: 0,
			max: 10000,
		},
	},
	containerWidth: {
		control: { type: 'text' },
		description: 'CSS width value for the chart container (e.g., "400px", "100%")',
	},
	containerHeight: {
		control: { type: 'text' },
		description: 'CSS height value for the chart container (e.g., "400px", "100%")',
	},
	resize: {
		control: { type: 'select' },
		options: [ 'none', 'both', 'horizontal', 'vertical' ],
		description: 'Resize behavior for the chart container',
	},
} as const;
