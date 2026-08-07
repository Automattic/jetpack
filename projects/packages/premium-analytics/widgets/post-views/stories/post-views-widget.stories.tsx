/**
 * The Post views widget is the post detail Traffic view's view-trend card:
 * the scoped post's views over the dashboard date range as a line chart. The
 * post scope arrives through `reportParams.post_id` (seeded from the detail
 * page URL in product); the `hasPostScope` control toggles it to exercise the
 * scopeless empty state.
 *
 * Data comes from the proxied `stats/post/{id}` endpoint, covered by the
 * shared report mocks' `stats-post` fixture (a deterministic daily series
 * ending today, so relative date presets always intersect it). The post
 * detail design has no period-over-period comparison, so the widget maps no
 * comparison rows; the dashboard story still passes comparison params so the
 * widget stays covered against crashing or inventing an overlay when a host
 * supplies them.
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
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import PostViewsRender from '../render';
import widgetDefinition, { type PostViewsGranularity } from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

// Any post ID resolves to the shared `stats-post` fixture; this one matches
// the fixture's own post row for coherence.
const MOCK_POST_ID = 779;

const POST_VIEWS_RENDER_MODULE = 'storybook/post-views';

interface PostViewsStoryControls {
	hasPostScope: boolean;
	granularity: PostViewsGranularity;
}

/**
 * Builds the widget attributes: the granularity attribute plus report params
 * with the post scope the detail page seeds from its URL when `hasPostScope`
 * is on. Comparison stays a parameter so the dashboard story can pass host
 * comparison params without duplicating the scoping rule.
 *
 * @param {PostViewsStoryControls} controls       - The story controls.
 * @param {boolean}                withComparison - Include previous-period comparison report params.
 * @return The widget attributes.
 */
function getPostViewsAttributes(
	{ hasPostScope, granularity }: PostViewsStoryControls,
	withComparison = false
): ComponentProps< typeof PostViewsRender >[ 'attributes' ] {
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
					'The "Post views" widget: the scoped post\'s view trend over the dashboard date range as a line chart — the legacy Calypso post summary chart. The view series comes from `stats/post`\'s full daily history, zero-filled and bucketed client-side per the host-rendered "Group by" control. The post detail page has no comparison control, so comparison report params are ignored. Without a post scope the widget renders a scopeless empty state.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof PostViewsRender > & PostViewsStoryControls >;

export default meta;

type Story = StoryObj< PostViewsStoryControls >;

/**
 * Default — the scoped post's views for the selected period: a single
 * "Views" line.
 */
export const Default: Story = {
	render: renderPostViews,
	args: { hasPostScope: true, granularity: 'day' },
	decorators: [ withWidgetCanvas ],
};

/**
 * NoPostScope — the widget without a `post_id` report param, as when added
 * outside a post detail page. Renders the scopeless empty state without
 * firing a stats request.
 */
export const NoPostScope: Story = {
	render: renderPostViews,
	args: { hasPostScope: false, granularity: 'day' },
	decorators: [ withWidgetCanvas ],
};

interface PostViewsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		PostViewsStoryControls {}

/**
 * Mounts the real `WidgetDashboard` with this single widget so it renders
 * exactly as it does in product (framed card, host "Group by" toolbar
 * control, sizing, edit mode). It passes comparison params unconditionally,
 * so the widget stays covered against crashing or inventing an overlay when
 * a host supplies comparison dates.
 *
 * @param {PostViewsDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real dashboard.
 */
function PostViewsDashboardStory( {
	hasPostScope,
	granularity,
	...dashboardArgs
}: PostViewsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ POST_VIEWS_RENDER_MODULE }
			renderComponent={ PostViewsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getPostViewsAttributes( { hasPostScope, granularity }, true ) }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< PostViewsDashboardStoryProps > = {
	render: args => <PostViewsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 2,
		widgetHeight: 2,
		hasPostScope: true,
		granularity: 'day',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
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
