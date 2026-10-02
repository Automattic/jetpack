/**
 * The all-time site summary behind this widget has no date range or comparison
 * period, so every story shows the same counts.
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
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
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import SharesRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SHARES_RENDER_MODULE = 'storybook/shares';
const SITE_SUMMARY_PATH_FRAGMENT = 'proxy/v1.1/stats';

/**
 * Forces the all-time site summary into a state for a story's lifetime.
 * `useStatsSite()` has a constant query key, so the shared entry has to be
 * evicted or the forced result leaks into another story.
 */
function forceSiteSummaryState( state: 'loading' | 'error' | 'empty' ) {
	queryClient.removeQueries( { queryKey: [ 'stats', 'site' ] } );
	setReportMockState( SITE_SUMMARY_PATH_FRAGMENT, state );

	return () => {
		setReportMockState( SITE_SUMMARY_PATH_FRAGMENT, null );
		queryClient.removeQueries( { queryKey: [ 'stats', 'site' ] } );
	};
}

// Build the story widget type from its manifest and module. `presentation`
// comes from widget.json ( 'framed' ), so the host frames the widget.
const storyWidgetType = createStoryWidgetType( widgetManifest, widgetDefinition );

function renderShares() {
	return <SharesRender attributes={ { reportParams: getDefaultQueryParams() } } />;
}

function SharesDashboardRender( props: WidgetRenderProps< unknown > ) {
	return <SharesRender { ...( props as ComponentProps< typeof SharesRender > ) } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Shares',
	component: SharesRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Shares" widget. Lists each social network the site\'s content was shared to, ranked by share count. Ported from the Jetpack Stats Shares module.',
			},
		},
	},
} satisfies Meta< typeof SharesRender >;

export default meta;

type Story = StoryObj< Partial< ComponentProps< typeof SharesRender > > >;

/**
 * The widget on its own, populated from the mocked site summary.
 */
export const Default: Story = {
	render: renderShares,
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the all-time site summary is in flight, so the widget shows its
 * loading state. The mock never resolves for the duration of this story.
 */
export const Loading: Story = {
	render: renderShares,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceSiteSummaryState( 'loading' ),
};

/**
 * The site-summary request failed: the widget shows its shares-specific error
 * state with a Retry action.
 */
export const Error: Story = {
	render: renderShares,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceSiteSummaryState( 'error' ),
};

/**
 * Resolved without positive share counts: the widget shows its empty-state
 * megaphone and guidance copy.
 */
export const Empty: Story = {
	render: renderShares,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceSiteSummaryState( 'empty' ),
};

function SharesDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ SHARES_RENDER_MODULE }
			renderComponent={ SharesDashboardRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( true ) } }
		/>
	);
}

/**
 * Renders the real registered widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <SharesDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
