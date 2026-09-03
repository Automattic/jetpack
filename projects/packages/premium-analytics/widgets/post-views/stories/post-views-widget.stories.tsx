/**
 * Served by the shared report mocks' `stats-post` fixture: a deterministic daily
 * series ending today, so relative date presets always intersect it.
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
import { presetForStoryInterval } from '../../stories/preset-for-story-interval';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	siteTimeZoneArgTypes,
	withSiteTimeZone,
	type SiteTimeZoneControls,
} from '../../stories/with-site-time-zone';
import PostViewsRender from '../render';
import widgetDefinition, { type PostViewsChartType } from '../widget';
import type { StatsChartBucketPeriod } from '@jetpack-premium-analytics/data';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

// Any post ID resolves to the shared `stats-post` fixture; this one matches
// the fixture's own post row for coherence.
const MOCK_POST_ID = 779;

const POST_VIEWS_RENDER_MODULE = 'storybook/post-views';

interface PostViewsStoryControls extends SiteTimeZoneControls {
	hasPostScope: boolean;
	interval: StatsChartBucketPeriod;
	chartType: PostViewsChartType;
}

/**
 * Builds the widget attributes. Comparison stays a parameter so the dashboard
 * story can pass host comparison params without duplicating the scoping rule.
 */
function getPostViewsAttributes(
	{ hasPostScope, interval, chartType }: PostViewsStoryControls,
	withComparison = false
): ComponentProps< typeof PostViewsRender >[ 'attributes' ] {
	return {
		chartType,
		reportParams: {
			...getDefaultQueryParams( withComparison, presetForStoryInterval( interval ) ),
			interval,
			...( hasPostScope ? { post_id: MOCK_POST_ID } : {} ),
		},
	};
}

function renderPostViews( controls: PostViewsStoryControls ) {
	return <PostViewsRender attributes={ getPostViewsAttributes( controls ) } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PostViews',
	component: PostViewsRender,
	tags: [ 'autodocs' ],
	decorators: [ withSiteTimeZone ],
	argTypes: {
		...siteTimeZoneArgTypes,
		hasPostScope: {
			control: 'boolean',
			description: 'Include the `post_id` report param the post detail page seeds from its URL.',
		},
		interval: {
			control: 'radio',
			options: [ 'day', 'week', 'month' ],
			description:
				'The page chart interval the widget buckets its daily history into. Monthly moves the story range to 90 days, the shortest preset that allows it.',
		},
		chartType: {
			control: 'radio',
			options: [ 'line', 'bar' ],
			description: 'The "Chart type" toolbar attribute rendered by the widget host.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					"The \"Post views\" widget: the scoped post's view trend over the dashboard date range as a line chart — the legacy Calypso post summary chart. The view series comes from `stats/post`'s full daily history, zero-filled and bucketed client-side at the page's chart interval. The post detail page has no comparison control, so comparison report params are ignored. Without a post scope the widget renders a scopeless empty state.",
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
	args: { hasPostScope: true, interval: 'day', chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

/**
 * NoPostScope — the widget without a `post_id` report param, as when added
 * outside a post detail page. Renders the scopeless empty state without
 * firing a stats request.
 */
export const NoPostScope: Story = {
	render: renderPostViews,
	args: { hasPostScope: false, interval: 'day', chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

interface PostViewsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		PostViewsStoryControls {}

/**
 * Mounts the real `WidgetDashboard` with this single widget. Comparison params
 * are passed unconditionally, so the widget stays covered against crashing or
 * inventing an overlay when a host supplies comparison dates.
 */
function PostViewsDashboardStory( {
	hasPostScope,
	interval,
	chartType,
	...dashboardArgs
}: PostViewsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ POST_VIEWS_RENDER_MODULE }
			renderComponent={ PostViewsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getPostViewsAttributes( { hasPostScope, interval, chartType }, true ) }
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
		interval: 'day',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		hasPostScope: {
			control: 'boolean',
			description: 'Include the `post_id` report param the post detail page seeds from its URL.',
		},
		interval: {
			control: 'radio',
			options: [ 'day', 'week', 'month' ],
			description:
				'The page chart interval the widget buckets its daily history into. Monthly moves the story range to 90 days, the shortest preset that allows it.',
		},
	},
};
