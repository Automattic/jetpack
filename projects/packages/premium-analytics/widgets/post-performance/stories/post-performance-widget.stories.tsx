/**
 * The Performance widget is the post detail Traffic view's main card: Views /
 * Comments / Likes metric tabs over a comparative view-trend chart. The post
 * scope arrives through `reportParams.post_id` (seeded from the detail page
 * URL in product); the `hasPostScope` control toggles it to exercise the
 * scopeless empty state. Comments and likes are lifetime totals with no
 * per-post series in the API, so those tabs render value-only.
 *
 * Data comes from the proxied `stats/post/{id}` endpoint, covered by the
 * shared report mocks' `stats-post` fixture (a deterministic daily series
 * ending today, so relative date presets always intersect it).
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import PostPerformanceRender from '../render';
import widgetDefinition, { type PostPerformanceGranularity } from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

// Any post ID resolves to the shared `stats-post` fixture; this one matches
// the fixture's own post row for coherence.
const MOCK_POST_ID = 779;

const POST_PERFORMANCE_RENDER_MODULE = 'storybook/post-performance';

interface PostPerformanceStoryControls {
	withComparison: boolean;
	hasPostScope: boolean;
	granularity: PostPerformanceGranularity;
}

/**
 * Builds the widget attributes: the granularity attribute plus report params
 * with the post scope the detail page seeds from its URL when `hasPostScope`
 * is on.
 *
 * @param {PostPerformanceStoryControls} controls - The story controls.
 * @return The widget attributes.
 */
function getPostPerformanceAttributes( {
	withComparison,
	hasPostScope,
	granularity,
}: PostPerformanceStoryControls ): ComponentProps< typeof PostPerformanceRender >[ 'attributes' ] {
	return {
		granularity,
		reportParams: {
			...getDefaultQueryParams( withComparison ),
			...( hasPostScope ? { post_id: MOCK_POST_ID } : {} ),
		},
	};
}

/**
 * Renders the data-connected widget with the composed attributes.
 *
 * @param {PostPerformanceStoryControls} controls - The story controls.
 * @return The rendered widget.
 */
function renderPostPerformance( controls: PostPerformanceStoryControls ) {
	return <PostPerformanceRender attributes={ getPostPerformanceAttributes( controls ) } />;
}

// Close-up canvas so the chart fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '420px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PostPerformance',
	component: PostPerformanceRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
		hasPostScope: {
			control: 'boolean',
			description: 'Include the `post_id` report param the post detail page seeds from its URL.',
		},
		granularity: {
			control: 'radio',
			options: [ 'day', 'week', 'month' ],
			description: 'The "Group by" toolbar attribute rendered by the widget host.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Performance" widget: the scoped post\'s views, comments, and likes as metric tabs over a comparative view-trend line chart — the post detail Traffic view\'s main card. Views carry the period total, delta, and series; comments and likes are lifetime totals with no per-post series in the API, so those tabs are value-only. Without a post scope the widget renders a scopeless empty state.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof PostPerformanceRender > & PostPerformanceStoryControls >;

export default meta;

type Story = StoryObj< PostPerformanceStoryControls >;

/**
 * Default — the scoped post's performance with a comparison overlay.
 */
export const Default: Story = {
	render: renderPostPerformance,
	args: { withComparison: true, hasPostScope: true, granularity: 'day' },
	decorators: [ withWidgetCanvas ],
};

/**
 * WithoutComparison — the primary period only; the Views tab shows no delta
 * and the chart no overlay.
 */
export const WithoutComparison: Story = {
	render: renderPostPerformance,
	args: { withComparison: false, hasPostScope: true, granularity: 'day' },
	decorators: [ withWidgetCanvas ],
};

/**
 * NoPostScope — the widget without a `post_id` report param, as when added
 * outside a post detail page. Renders the scopeless empty state without
 * firing a stats request.
 */
export const NoPostScope: Story = {
	render: renderPostPerformance,
	args: { withComparison: false, hasPostScope: false, granularity: 'day' },
	decorators: [ withWidgetCanvas ],
};

interface PostPerformanceDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		PostPerformanceStoryControls {}

/**
 * Mounts the real `WidgetDashboard` with this single widget so it renders
 * exactly as it does in product (framed card, host "Group by" toolbar
 * control, sizing, edit mode).
 *
 * @param {PostPerformanceDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real dashboard.
 */
function PostPerformanceDashboardStory( {
	withComparison,
	hasPostScope,
	granularity,
	...dashboardArgs
}: PostPerformanceDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'framed' } }
			renderModule={ POST_PERFORMANCE_RENDER_MODULE }
			renderComponent={ PostPerformanceRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getPostPerformanceAttributes( { withComparison, hasPostScope, granularity } ) }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< PostPerformanceDashboardStoryProps > = {
	render: args => <PostPerformanceDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 3,
		widgetHeight: 2,
		withComparison: true,
		hasPostScope: true,
		granularity: 'day',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
		hasPostScope: {
			control: 'boolean',
			description: 'Include the `post_id` report param the post detail page seeds from its URL.',
		},
		granularity: {
			control: 'radio',
			options: [ 'day', 'week', 'month' ],
			description: 'The "Group by" toolbar attribute rendered by the widget host.',
		},
	},
};
