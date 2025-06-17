import type { StoryFn, StoryObj } from '@storybook/react';
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
	const Template: StoryFn< T > = args => ChartComponent( args );

	const legendStoryArgs = {
		...baseStoryArgs,
		showLegend: true,
		legendOrientation: 'horizontal' as const,
	};

	const stories: Record< string, StoryObj< T > > = {
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
				legendAlign: 'right',
				legendVerticalAlign: 'top',
			},
		},

		TopLeft: {
			render: Template,
			args: {
				...legendStoryArgs,
				legendAlign: 'left',
				legendVerticalAlign: 'top',
			},
		},

		TopCenter: {
			render: Template,
			args: {
				...legendStoryArgs,
				legendAlign: 'center',
				legendVerticalAlign: 'top',
			},
		},

		BottomLeft: {
			render: Template,
			args: {
				...legendStoryArgs,
				legendAlign: 'left',
				legendVerticalAlign: 'bottom',
			},
		},

		BottomRight: {
			render: Template,
			args: {
				...legendStoryArgs,
				legendAlign: 'right',
				legendVerticalAlign: 'bottom',
			},
		},

		VerticalOrientation: {
			render: Template,
			args: {
				...legendStoryArgs,
				legendOrientation: 'vertical',
				legendAlign: 'right',
				legendVerticalAlign: 'top',
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

/**
 * Standard legend argTypes for Storybook controls
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
	showLegend: {
		control: 'boolean',
	},
};
