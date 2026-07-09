import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import LineChart from '../../../../../js-packages/charts/src/charts/line-chart/line-chart';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import BookingsOverTimeRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const BOOKINGS_OVER_TIME_RENDER_MODULE = 'storybook/bookings-over-time';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

// Static Storybook builds need this source import before ComparativeLineChart reads LineChart.Legend.
const ensureLineChartComposition = () => LineChart.Legend;

type BookingsOverTimeRenderProps = ComponentProps< typeof BookingsOverTimeRender >;

interface BookingsOverTimeStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type BookingsOverTimeStoryProps = BookingsOverTimeRenderProps & BookingsOverTimeStoryControls;

interface BookingsOverTimeDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		BookingsOverTimeStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getBookingsOverTimeAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): BookingsOverTimeRenderProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< BookingsOverTimeStoryControls > ) {
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

function getBookingsOverTimeSource( args: Partial< BookingsOverTimeStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<BookingsOverTimeRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderBookingsOverTime( { withComparison, preset }: BookingsOverTimeStoryControls ) {
	ensureLineChartComposition();

	return (
		<BookingsOverTimeRender
			attributes={ getBookingsOverTimeAttributes( withComparison, preset ) }
		/>
	);
}

function BookingsOverTimeDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: BookingsOverTimeDashboardStoryProps ) {
	ensureLineChartComposition();

	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ BOOKINGS_OVER_TIME_RENDER_MODULE }
			renderComponent={ BookingsOverTimeRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getBookingsOverTimeAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/BookingsOverTime',
	component: BookingsOverTimeRender,
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
				component: 'Dashboard widget that displays bookings over time for the selected period.',
			},
		},
	},
} satisfies Meta< BookingsOverTimeStoryProps >;

export default meta;

type Story = StoryObj< BookingsOverTimeStoryControls >;
type DashboardStory = StoryObj< BookingsOverTimeDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderBookingsOverTime,
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
					storyContext: { args: Partial< BookingsOverTimeStoryControls > }
				) => getBookingsOverTimeSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period change and line chart data.
 */
export const WithComparison: Story = {
	render: renderBookingsOverTime,
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
					storyContext: { args: Partial< BookingsOverTimeStoryControls > }
				) => getBookingsOverTimeSource( storyContext.args ),
			},
		},
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <BookingsOverTimeDashboardStory { ...args } />,
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
\trenderModule="storybook/bookings-over-time"
\trenderComponent={ BookingsOverTimeRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
