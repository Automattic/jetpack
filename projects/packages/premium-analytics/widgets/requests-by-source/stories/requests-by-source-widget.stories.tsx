import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import { forceStatsMockState } from '../../stories/force-stats-mock-state';
import RequestsBySourceRender from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const RENDER_MODULE = 'storybook/requests-by-source';
const ENDPOINT = 'stats/ua-queries';

const storyWidgetType = createStoryWidgetType( widgetManifest );

interface RequestsBySourceStoryControls {
	withComparison: boolean;
}

interface RequestsBySourceDashboardStoryProps
	extends WidgetDashboardWithWidgetControls, RequestsBySourceStoryControls {}

const WITH_COMPARISON_ARG_TYPE = {
	control: 'boolean',
	description: 'Include previous-period comparison report params.',
} as const;

function renderRequestsBySource( { withComparison }: RequestsBySourceStoryControls ) {
	return (
		<RequestsBySourceRender
			attributes={ { reportParams: getDefaultQueryParams( withComparison, 'last-30-days' ) } }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderOnPreset( preset: PresetType ) {
	return (
		<RequestsBySourceRender
			attributes={ { reportParams: getDefaultQueryParams( false, preset ) } }
		/>
	);
}

function DashboardRender( props: WidgetRenderProps< unknown > ) {
	return (
		<RequestsBySourceRender { ...( props as ComponentProps< typeof RequestsBySourceRender > ) } />
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/RequestsBySource',
	component: RequestsBySourceRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: WITH_COMPARISON_ARG_TYPE,
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Requests by source" widget of the AI tab. Totals the requests the edge saw from people, AI bots and other bots, and those it blocked, and stacks them over the dashboard date range.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof RequestsBySourceRender > & RequestsBySourceStoryControls >;

export default meta;

type Story = StoryObj< ComponentProps< typeof RequestsBySourceRender > >;

export const Default: StoryObj< RequestsBySourceStoryControls > = {
	render: renderRequestsBySource,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/** With the comparison on, each total shows its change against the comparison period. */
export const WithComparison: StoryObj< RequestsBySourceStoryControls > = {
	render: renderRequestsBySource,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

/** A window of two days or fewer is drawn by the hour. */
export const Hourly: Story = {
	render: () => renderOnPreset( 'today' ),
	decorators: [ withWidgetCanvas ],
};

/** The chart type setting swaps the stacked areas for stacked bars. */
export const Bars: Story = {
	render: () => (
		<RequestsBySourceRender
			attributes={ {
				reportParams: getDefaultQueryParams( false, 'last-30-days' ),
				chartType: 'bar',
			} }
		/>
	),
	decorators: [ withWidgetCanvas ],
};

export const Loading: Story = {
	render: () => renderOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( ENDPOINT, 'loading' );
		return () => forceStatsMockState( ENDPOINT, null );
	},
};

export const Error: Story = {
	render: () => renderOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( ENDPOINT, 'error' );
		return () => forceStatsMockState( ENDPOINT, null );
	},
};

export const ErrorRetryable: Story = {
	render: () => renderOnPreset( 'last-12-months' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( ENDPOINT, 'error-retryable' );
		return () => forceStatsMockState( ENDPOINT, null );
	},
};

export const Empty: Story = {
	render: () => renderOnPreset( 'last-year' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( ENDPOINT, 'empty' );
		return () => forceStatsMockState( ENDPOINT, null );
	},
};

export const WidgetDashboardWithWidget: StoryObj< RequestsBySourceDashboardStoryProps > = {
	tags: [ 'widget-dashboard' ],
	render: ( { withComparison, ...args } ) => (
		<WidgetDashboardWithWidgetStory
			{ ...args }
			widgetType={ storyWidgetType }
			renderModule={ RENDER_MODULE }
			renderComponent={ DashboardRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	),
	args: { ...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS, withComparison: true },
	argTypes: { ...widgetDashboardWithWidgetArgTypes, withComparison: WITH_COMPARISON_ARG_TYPE },
};
