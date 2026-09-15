/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	registerReportMocks,
	setReportMockState,
	type ReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import SubscriberHighlightsRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SUBSCRIBER_HIGHLIGHTS_RENDER_MODULE = 'storybook/subscriber-highlights';

function renderSubscriberHighlights() {
	return <SubscriberHighlightsRender attributes={ { reportParams: getDefaultQueryParams() } } />;
}

// The fragment matches both requests the widget makes: `subscribers/counts` and `stats/subscribers`.
function forceSubscribersState( state: ReportMockState ) {
	return () => {
		setReportMockState( 'subscribers', state );
		return () => setReportMockState( 'subscribers', null );
	};
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/SubscriberHighlights',
	component: SubscriberHighlightsRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Subscriber highlights" widget, ported from the Jetpack Stats Subscribers "All-time stats" card. Shows total subscribers from `useStatsSubscribersCounts`, next to the subscriber count 30, 60, and 90 days ago from `useStatsSubscribersDaysAgo`. The counts do not follow the dashboard date range. In Storybook, `registerReportMocks()` serves both endpoints.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof SubscriberHighlightsRender > >;

export default meta;

type Story = StoryObj< ComponentProps< typeof SubscriberHighlightsRender > >;

/**
 * The widget on its own, populated from the mocked subscriber endpoints.
 */
export const Default: Story = {
	render: renderSubscriberHighlights,
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetches are in flight, so the widget shows its loading state.
 */
export const Loading: Story = {
	render: renderSubscriberHighlights,
	// Off the shared autodocs page: the override is keyed by path.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceSubscribersState( 'loading' ),
};

/**
 * Every fetch failed: the widget shows its error state with a Retry action.
 */
export const Error: Story = {
	render: renderSubscriberHighlights,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceSubscribersState( 'error' ),
};

/**
 * Resolved without counts: the widget shows its empty state.
 */
export const Empty: Story = {
	render: renderSubscriberHighlights,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceSubscribersState( 'empty' ),
};

function SubscriberHighlightsDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ SUBSCRIBER_HIGHLIGHTS_RENDER_MODULE }
			renderComponent={
				SubscriberHighlightsRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ { reportParams: getDefaultQueryParams( true ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <SubscriberHighlightsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 3,
		widgetHeight: 1,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
