import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import LineChart from '../../../../../js-packages/charts/src/charts/line-chart/line-chart';
import VisitorsOverTimeRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const VISITORS_OVER_TIME_RENDER_MODULE = 'storybook/visitors-over-time';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;
// Static Storybook builds need this source import before ComparativeLineChart reads LineChart.Legend.
const ensureLineChartComposition = () => LineChart.Legend;

type VisitorsOverTimeWidgetProps = ComponentProps< typeof VisitorsOverTimeRender >;
const noopSetError: VisitorsOverTimeWidgetProps[ 'setError' ] = () => {};

interface VisitorsOverTimeStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type VisitorsOverTimeStoryProps = VisitorsOverTimeWidgetProps & VisitorsOverTimeStoryControls;

interface VisitorsOverTimeDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		VisitorsOverTimeStoryControls {}

function getVisitorsOverTimeAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): VisitorsOverTimeWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< VisitorsOverTimeStoryControls > ) {
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

function getVisitorsOverTimeSource( args: Partial< VisitorsOverTimeStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<VisitorsOverTimeRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderVisitorsOverTime( { withComparison, preset }: VisitorsOverTimeStoryControls ) {
	ensureLineChartComposition();

	return (
		<VisitorsOverTimeRender
			attributes={ getVisitorsOverTimeAttributes( withComparison, preset ) }
			setError={ noopSetError }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderVisitorsOverTimeOnPreset( preset: SelectablePresetId ) {
	ensureLineChartComposition();

	return (
		<VisitorsOverTimeRender
			attributes={ getVisitorsOverTimeAttributes( false, preset ) }
			setError={ noopSetError }
		/>
	);
}

function VisitorsOverTimeDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: VisitorsOverTimeDashboardStoryProps ) {
	ensureLineChartComposition();

	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ VISITORS_OVER_TIME_RENDER_MODULE }
			renderComponent={ VisitorsOverTimeRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getVisitorsOverTimeAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/VisitorsOverTime',
	component: VisitorsOverTimeRender,
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
				component: 'Dashboard widget that displays website visitor trends for the selected period.',
			},
		},
	},
} satisfies Meta< VisitorsOverTimeStoryProps >;

export default meta;

type Story = StoryObj< VisitorsOverTimeStoryControls >;
type DashboardStory = StoryObj< VisitorsOverTimeDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderVisitorsOverTime,
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
					storyContext: { args: Partial< VisitorsOverTimeStoryControls > }
				) => getVisitorsOverTimeSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period change and sparkline data.
 */
export const WithComparison: Story = {
	render: renderVisitorsOverTime,
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
					storyContext: { args: Partial< VisitorsOverTimeStoryControls > }
				) => getVisitorsOverTimeSource( storyContext.args ),
			},
		},
	},
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderVisitorsOverTimeOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'sessions/by-date', 'loading' );
		return () => setReportMockState( 'sessions/by-date', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderVisitorsOverTimeOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'sessions/by-date', 'error' );
		return () => setReportMockState( 'sessions/by-date', null );
	},
};

/**
 * Resolved with no visitor data: the widget shows its empty state ("No visitors
 * in this period.").
 */
export const Empty: Story = {
	render: () => renderVisitorsOverTimeOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'sessions/by-date', 'empty' );
		return () => setReportMockState( 'sessions/by-date', null );
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <VisitorsOverTimeDashboardStory { ...args } />,
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
\trenderModule="storybook/visitors-over-time"
\trenderComponent={ VisitorsOverTimeRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
