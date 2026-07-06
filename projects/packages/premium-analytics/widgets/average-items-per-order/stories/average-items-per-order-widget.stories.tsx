import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import AverageItemsPerOrderRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const AVERAGE_ITEMS_RENDER_MODULE = 'storybook/average-items-per-order';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type AverageItemsPerOrderRenderProps = ComponentProps< typeof AverageItemsPerOrderRender >;

interface AverageItemsPerOrderStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type AverageItemsPerOrderStoryProps = AverageItemsPerOrderRenderProps &
	AverageItemsPerOrderStoryControls;

interface AverageItemsPerOrderDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		AverageItemsPerOrderStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getAverageItemsPerOrderAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): AverageItemsPerOrderRenderProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< AverageItemsPerOrderStoryControls > ) {
	const hasComparison = Boolean( withComparison );
	const storyPreset = preset ?? DEFAULT_PRESET;

	if ( ! hasComparison && storyPreset === DEFAULT_PRESET ) {
		return 'getDefaultQueryParams()';
	}

	if ( hasComparison && storyPreset === DEFAULT_PRESET ) {
		return 'getDefaultQueryParams( true )';
	}

	return `getDefaultQueryParams( ${ hasComparison ? 'true' : 'false' }, '${ storyPreset }' )`;
}

function getAverageItemsPerOrderSource( args: Partial< AverageItemsPerOrderStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<AverageItemsPerOrderRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderAverageItemsPerOrder( {
	withComparison,
	preset,
}: AverageItemsPerOrderStoryControls ) {
	return (
		<AverageItemsPerOrderRender
			attributes={ getAverageItemsPerOrderAttributes( withComparison, preset ) }
		/>
	);
}

function AverageItemsPerOrderDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: AverageItemsPerOrderDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ AVERAGE_ITEMS_RENDER_MODULE }
			renderComponent={
				AverageItemsPerOrderRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ getAverageItemsPerOrderAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/AverageItemsPerOrder',
	component: AverageItemsPerOrderRender,
	tags: [ 'autodocs' ],
	argTypes: {
		preset: {
			control: 'select',
			options: PRESET_OPTIONS,
			description: 'Date-range preset used to generate the widget report params.',
		},
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Average items per order" widget. Fetches the orders report and displays the average number of items per order with optional period-over-period comparison and a sparkline.',
			},
		},
	},
} satisfies Meta< AverageItemsPerOrderStoryProps >;

export default meta;

type Story = StoryObj< AverageItemsPerOrderStoryControls >;
type DashboardStory = StoryObj< AverageItemsPerOrderDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderAverageItemsPerOrder,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: false,
	},
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			source: {
				transform: (
					_source: string,
					storyContext: { args: Partial< AverageItemsPerOrderStoryControls > }
				) => getAverageItemsPerOrderSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period change and sparkline data.
 */
export const WithComparison: Story = {
	render: renderAverageItemsPerOrder,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: true,
	},
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			source: {
				transform: (
					_source: string,
					storyContext: { args: Partial< AverageItemsPerOrderStoryControls > }
				) => getAverageItemsPerOrderSource( storyContext.args ),
			},
		},
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <AverageItemsPerOrderDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		preset: DEFAULT_PRESET,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		preset: {
			control: 'select',
			options: PRESET_OPTIONS,
			description: 'Date-range preset used to generate the widget report params.',
		},
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
	},
	parameters: {
		docs: {
			source: {
				code: `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<WidgetDashboardWithWidget
\twidgetType={ widgetDefinition }
\trenderModule="storybook/average-items-per-order"
\trenderComponent={ AverageItemsPerOrderRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
