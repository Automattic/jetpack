/**
 * The Post views widget is the post detail Traffic view's view-trend card:
 * the scoped post's views over the dashboard date range as a comparative
 * line chart. The post scope arrives through `reportParams.post_id` (seeded
 * from the detail page URL in product); the `hasPostScope` control toggles it
 * to exercise the scopeless empty state.
 *
 * Data comes from the proxied `stats/post/{id}` endpoint, covered by the
 * shared report mocks' `stats-post` fixture (a deterministic daily series
 * ending today, so relative date presets always intersect it). The comparison
 * window is sliced client-side from the same request.
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
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import PostViewsRender from '../render';
import widgetDefinition, { type PostViewsGranularity } from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

// Any post ID resolves to the shared `stats-post` fixture; this one matches
// the fixture's own post row for coherence.
const MOCK_POST_ID = 779;

const POST_VIEWS_RENDER_MODULE = 'storybook/post-views';

interface PostViewsStoryControls {
	withComparison: boolean;
	hasPostScope: boolean;
	granularity: PostViewsGranularity;
}

/**
 * Builds the widget attributes: the granularity attribute plus report params
 * with the post scope the detail page seeds from its URL when `hasPostScope`
 * is on.
 *
 * @param {PostViewsStoryControls} controls - The story controls.
 * @return The widget attributes.
 */
function getPostViewsAttributes( {
	withComparison,
	hasPostScope,
	granularity,
}: PostViewsStoryControls ): ComponentProps< typeof PostViewsRender >[ 'attributes' ] {
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
 * @param {PostViewsStoryControls} controls - The story controls.
 * @return The rendered widget.
 */
function renderPostViews( controls: PostViewsStoryControls ) {
	return <PostViewsRender attributes={ getPostViewsAttributes( controls ) } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PostViews',
	component: PostViewsRender,
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
					'The "Post views" widget: the scoped post\'s view trend over the dashboard date range as a comparative line chart — the legacy Calypso post summary chart. The view series comes from `stats/post`\'s full daily history, zero-filled and bucketed client-side per the host-rendered "Group by" control, with the comparison window sliced from the same request. Without a post scope the widget renders a scopeless empty state.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof PostViewsRender > & PostViewsStoryControls >;

export default meta;

type Story = StoryObj< PostViewsStoryControls >;

/**
 * Default — the scoped post's views for the primary period only: a single
 * "Views" line with no overlay.
 */
export const Default: Story = {
	render: renderPostViews,
	args: { withComparison: false, hasPostScope: true, granularity: 'day' },
	decorators: [ withWidgetCanvas ],
};

/**
 * WithComparison — the previous-period comparison from the date range picker;
 * the chart adds a dashed previous-period overlay and the legend switches to
 * date-range labels.
 */
export const WithComparison: Story = {
	render: renderPostViews,
	args: { withComparison: true, hasPostScope: true, granularity: 'day' },
	decorators: [ withWidgetCanvas ],
};

/**
 * NoPostScope — the widget without a `post_id` report param, as when added
 * outside a post detail page. Renders the scopeless empty state without
 * firing a stats request.
 */
export const NoPostScope: Story = {
	render: renderPostViews,
	args: { withComparison: false, hasPostScope: false, granularity: 'day' },
	decorators: [ withWidgetCanvas ],
};

interface PostViewsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		PostViewsStoryControls {}

/**
 * Mounts the real `WidgetDashboard` with this single widget so it renders
 * exactly as it does in product (framed card, host "Group by" toolbar
 * control, sizing, edit mode).
 *
 * @param {PostViewsDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real dashboard.
 */
function PostViewsDashboardStory( {
	withComparison,
	hasPostScope,
	granularity,
	...dashboardArgs
}: PostViewsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'framed' } }
			renderModule={ POST_VIEWS_RENDER_MODULE }
			renderComponent={ PostViewsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getPostViewsAttributes( { withComparison, hasPostScope, granularity } ) }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< PostViewsDashboardStoryProps > = {
	render: args => <PostViewsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 2,
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
