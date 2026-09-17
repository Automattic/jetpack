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
	paidSubscribersArgTypes,
	withPaidSubscribers,
	type PaidSubscribersControls,
} from '../../stories/with-paid-subscribers';
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
	beforeEach: withPaidSubscribers,
	argTypes: {
		...paidSubscribersArgTypes,
	},
	args: {
		hasPaidSubscribers: false,
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Subscriber highlights" widget, ported from the Jetpack Stats Subscribers "All-time stats" card. Shows all-time subscribers from `useStatsSubscribersCounts`. A site with paid subscribers also sees paid and free subscribers; any other site sees the subscriber count 30, 60, and 90 days ago from `useStatsSubscribersDaysAgo`. Social followers join either set on any site that has some, and the tile is hidden rather than showing zero. The counts do not follow the dashboard date range. In Storybook, `registerReportMocks()` serves every endpoint, with no paid subscribers by default.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof SubscriberHighlightsRender > & PaidSubscribersControls >;

export default meta;

type Story = StoryObj< PaidSubscribersControls >;

/**
 * The widget on its own. Turn on "Has paid subscribers" to swap the 30, 60 and
 * 90 days ago tiles for the paid and free breakdown.
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

interface SubscriberHighlightsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		PaidSubscribersControls {}

function SubscriberHighlightsDashboardStory(
	dashboardArgs: SubscriberHighlightsDashboardStoryProps
) {
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

export const WidgetDashboardWithWidget: StoryObj< SubscriberHighlightsDashboardStoryProps > = {
	render: args => <SubscriberHighlightsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 3,
		widgetHeight: 1,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		...paidSubscribersArgTypes,
	},
};
