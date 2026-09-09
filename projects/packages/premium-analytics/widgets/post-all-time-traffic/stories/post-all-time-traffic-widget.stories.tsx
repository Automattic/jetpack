/**
 * The All-time traffic widget is the post detail Traffic view's history card:
 * every month of the scoped post's views, one row per year. It reads the
 * post's whole life regardless of the page period, and picking a month
 * applies that month to the page. The post scope arrives through
 * `reportParams.post_id` (seeded from the detail page URL in product); the
 * `hasPostScope` control toggles it to exercise the scopeless empty state.
 *
 * Data comes from the proxied `stats/post/{id}` endpoint, covered by the
 * shared report mocks' `stats-post` fixture, whose yearly tables roll up a
 * deterministic daily series ending today.
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withStoryRouter } from '../../stories/with-story-router';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import PostAllTimeTrafficRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

// Any post ID resolves to the shared `stats-post` fixture; this one matches
// the fixture's own post row for coherence.
const MOCK_POST_ID = 779;

const POST_ALL_TIME_TRAFFIC_RENDER_MODULE = 'storybook/post-all-time-traffic';

const POST_STATS_REQUEST_PATH = `stats/post/${ MOCK_POST_ID }`;

interface PostAllTimeTrafficStoryControls {
	hasPostScope: boolean;
}

function getPostAllTimeTrafficAttributes(
	{ hasPostScope }: PostAllTimeTrafficStoryControls,
	withComparison = false
): ComponentProps< typeof PostAllTimeTrafficRender >[ 'attributes' ] {
	return {
		reportParams: {
			...getDefaultQueryParams( withComparison ),
			...( hasPostScope ? { post_id: MOCK_POST_ID } : {} ),
		},
	};
}

function renderPostAllTimeTraffic( controls: PostAllTimeTrafficStoryControls ) {
	return <PostAllTimeTrafficRender attributes={ getPostAllTimeTrafficAttributes( controls ) } />;
}

const hasPostScopeArgType = {
	control: 'boolean',
	description: 'Include the `post_id` report param the post detail page seeds from its URL.',
} as const;

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PostAllTimeTraffic',
	component: PostAllTimeTrafficRender,
	tags: [ 'autodocs' ],
	// The widget applies a picked month through the route's date filters, so it
	// needs a router even in the close-up stories that mount it without a dashboard.
	decorators: [ withStoryRouter ],
	argTypes: {
		hasPostScope: hasPostScopeArgType,
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "All-time traffic" widget: every month of the scoped post\'s views, one row per year. It always covers the post\'s whole life, whatever period the page shows, and picking a month applies that month to the page. Without a post scope the widget renders a scopeless empty state.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof PostAllTimeTrafficRender > & PostAllTimeTrafficStoryControls
>;

export default meta;

type Story = StoryObj< PostAllTimeTrafficStoryControls >;

/**
 * Default — the scoped post's monthly views across its life.
 */
export const Default: Story = {
	render: renderPostAllTimeTraffic,
	args: { hasPostScope: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * NoPostScope — the widget without a `post_id` report param, as when added
 * outside a post detail page. Renders the scopeless empty state without
 * firing a stats request.
 */
export const NoPostScope: Story = {
	render: renderPostAllTimeTraffic,
	args: { hasPostScope: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Loading — the first fetch is still in flight, so the widget shows its
 * heatmap skeleton. The mock is forced to never resolve for this story.
 */
export const Loading: Story = {
	render: renderPostAllTimeTraffic,
	args: { hasPostScope: true },
	// Off the shared autodocs page — path-keyed override; see setReportMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( POST_STATS_REQUEST_PATH, 'loading' );
		return () => setReportMockState( POST_STATS_REQUEST_PATH, null );
	},
};

/**
 * Error — the fetch failed with a permission 403: neutral copy, no retry.
 */
export const Error: Story = {
	render: renderPostAllTimeTraffic,
	args: { hasPostScope: true },
	// Off the shared autodocs page — path-keyed override; see setReportMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( POST_STATS_REQUEST_PATH, 'error' );
		return () => setReportMockState( POST_STATS_REQUEST_PATH, null );
	},
};

/**
 * ErrorRetryable — the proxy's `no_connection` 403, which can heal after
 * reconnecting, so the widget offers a Retry action.
 */
export const ErrorRetryable: Story = {
	render: renderPostAllTimeTraffic,
	args: { hasPostScope: true },
	// Off the shared autodocs page — path-keyed override; see setReportMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( POST_STATS_REQUEST_PATH, 'error-retryable' );
		return () => setReportMockState( POST_STATS_REQUEST_PATH, null );
	},
};

/**
 * Empty — a scoped post the endpoint has no yearly stats for.
 */
export const Empty: Story = {
	render: renderPostAllTimeTraffic,
	args: { hasPostScope: true },
	// Off the shared autodocs page — path-keyed override; see setReportMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( POST_STATS_REQUEST_PATH, 'empty' );
		return () => setReportMockState( POST_STATS_REQUEST_PATH, null );
	},
};

interface PostAllTimeTrafficDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		PostAllTimeTrafficStoryControls {}

/**
 * Mounts the real `WidgetDashboard` with this single widget so it renders
 * exactly as it does in product (framed card, sizing, host environment).
 */
function PostAllTimeTrafficDashboardStory( {
	hasPostScope,
	...dashboardArgs
}: PostAllTimeTrafficDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ POST_ALL_TIME_TRAFFIC_RENDER_MODULE }
			renderComponent={ PostAllTimeTrafficRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getPostAllTimeTrafficAttributes( { hasPostScope }, true ) }
		/>
	);
}

/**
 * Mirrors the production placement (full width × 2 rows).
 */
export const WidgetDashboardWithWidget: StoryObj< PostAllTimeTrafficDashboardStoryProps > = {
	render: args => <PostAllTimeTrafficDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 3,
		widgetHeight: 2,
		hasPostScope: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		hasPostScope: hasPostScopeArgType,
	},
};
