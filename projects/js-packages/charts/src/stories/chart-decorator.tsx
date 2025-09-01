import { GlobalChartsProvider } from '../providers/chart-context/global-charts-provider';
import { CHART_THEME_MAP } from './theme-config';
import type { Decorator } from '@storybook/react';

/**
 * Generic StoryArgs type that extends any chart component props with themeName
 * This can be used by all chart stories to ensure consistent theming support
 */
export type ChartStoryArgs< T = Record< string, unknown > > = T & {
	themeName?: string;
};

type StoryArgs = ChartStoryArgs;

/**
 * Shared decorator for chart stories with GlobalChartsProvider and dynamic theme support
 * Provides a resizable container for testing responsive behavior
 * @param Story      - The story component to render
 * @param root0      - The story context object
 * @param root0.args - The story arguments
 * @return The decorated story component wrapped in GlobalChartsProvider and container
 */
export const chartDecorator: Decorator = ( Story, { args }: { args: StoryArgs } ) => {
	const theme = CHART_THEME_MAP[ args.themeName || 'default' ];

	return (
		<GlobalChartsProvider theme={ theme }>
			<div
				style={ {
					resize: 'both',
					overflow: 'auto',
					padding: '2rem',
					width: '800px',
					maxWidth: '1200px',
					border: '1px dashed #ccc',
					display: 'inline-block',
				} }
			>
				<Story />
			</div>
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
} as const;
