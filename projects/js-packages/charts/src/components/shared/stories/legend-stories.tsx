import React from 'react';
import { legendArgTypes } from '../../../stories/legend-config';
import type { StoryFn } from '@storybook/react';
import type { ComponentType } from 'react';

/**
 * Creates reusable legend positioning stories for any chart component
 * @param ChartComponent         - The chart component to create stories for
 * @param baseStoryArgs          - Base arguments for the chart component
 * @param options                - Configuration options for story generation
 * @param options.customStories  - Additional story variants specific to the chart type
 * @param options.customArgTypes - Override default legend positioning argTypes if needed
 * @return Object containing story meta and story objects for legend positioning
 */
export function createLegendStories< T extends Record< string, unknown > >(
	ChartComponent: ComponentType< T >,
	baseStoryArgs: T,
	options: {
		/**
		 * Additional story variants specific to the chart type
		 */
		customStories?: Record< string, Partial< T > >;
		/**
		 * Override default legend positioning argTypes if needed
		 */
		customArgTypes?: Record< string, unknown >;
	} = {}
) {
	const Template: StoryFn< T > = ( args: T ) => React.createElement( ChartComponent, args );

	const legendStoryArgs = {
		...baseStoryArgs,
		showLegend: true,
		legendOrientation: 'horizontal' as const,
	};

	const stories = {
		Default: {
			render: Template,
			args: {
				...legendStoryArgs,
			},
		},

		TopRight: {
			render: Template,
			args: {
				...legendStoryArgs,
				legendAlignmentHorizontal: 'right',
				legendAlignmentVertical: 'top',
			},
		},

		TopLeft: {
			render: Template,
			args: {
				...legendStoryArgs,
				legendAlignmentHorizontal: 'left',
				legendAlignmentVertical: 'top',
			},
		},

		TopCenter: {
			render: Template,
			args: {
				...legendStoryArgs,
				legendAlignmentHorizontal: 'center',
				legendAlignmentVertical: 'top',
			},
		},

		BottomLeft: {
			render: Template,
			args: {
				...legendStoryArgs,
				legendAlignmentHorizontal: 'left',
				legendAlignmentVertical: 'bottom',
			},
		},

		BottomRight: {
			render: Template,
			args: {
				...legendStoryArgs,
				legendAlignmentHorizontal: 'right',
				legendAlignmentVertical: 'bottom',
			},
		},

		VerticalOrientation: {
			render: Template,
			args: {
				...legendStoryArgs,
				legendOrientation: 'vertical',
				legendAlignmentHorizontal: 'right',
				legendAlignmentVertical: 'top',
			},
		},
	};

	// Add custom stories if provided
	if ( options.customStories ) {
		Object.entries( options.customStories ).forEach( ( [ key, customArgs ] ) => {
			stories[ key ] = {
				render: Template,
				args: {
					...legendStoryArgs,
					...customArgs,
				},
			};
		} );
	}

	return stories;
}

// Re-export legendArgTypes for convenience
export { legendArgTypes };
