/**
 * The video detail design has no period-over-period comparison, so the widget
 * maps no comparison rows; the dashboard story still passes comparison params so
 * it stays covered against inventing an overlay when a host supplies them.
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
import VideoDetailViewsPerformanceRender from '../render';
import widgetDefinition, { type VideoDetailViewsPerformanceChartType } from '../widget';
import type { StatsChartBucketPeriod } from '@jetpack-premium-analytics/data';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

// A stand-in VideoPress post ID. The mocked `stats/video/{id}` endpoint
// returns the same fixture for any ID.
const MOCK_VIDEO_ID = 105;

const VIDEO_DETAIL_VIEWS_PERFORMANCE_RENDER_MODULE = 'storybook/video-detail-views-performance';

interface VideoDetailViewsPerformanceStoryControls {
	hasVideoScope: boolean;
	interval: StatsChartBucketPeriod;
	chartType: VideoDetailViewsPerformanceChartType;
}

/**
 * Comparison stays a parameter so the dashboard story can pass host comparison
 * params without duplicating the scoping rule.
 */
function getVideoDetailViewsPerformanceAttributes(
	{ hasVideoScope, interval, chartType }: VideoDetailViewsPerformanceStoryControls,
	withComparison = false
): ComponentProps< typeof VideoDetailViewsPerformanceRender >[ 'attributes' ] {
	return {
		chartType,
		reportParams: {
			...getDefaultQueryParams( withComparison, presetForStoryInterval( interval ) ),
			interval,
			...( hasVideoScope ? { post_id: MOCK_VIDEO_ID } : {} ),
		},
	};
}

function renderVideoDetailViewsPerformance( controls: VideoDetailViewsPerformanceStoryControls ) {
	return (
		<VideoDetailViewsPerformanceRender
			attributes={ getVideoDetailViewsPerformanceAttributes( controls ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/VideoDetailViewsPerformance',
	component: VideoDetailViewsPerformanceRender,
	tags: [ 'autodocs' ],
	argTypes: {
		hasVideoScope: {
			control: 'boolean',
			description: 'Include the `post_id` report param the video detail page seeds from its URL.',
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
					"The \"Video performance\" widget: the scoped video's views, impressions, hours watched, and retention rate over the dashboard date range as selectable metric tabs, each headlined by the window's canonical total. The series come from the `stats/video/{id}` `statType=all` daily history for the selected window, zero-filled and bucketed client-side at the page's chart interval (retention rate is play-weighted, not averaged). The video detail page has no comparison control, so comparison report params are ignored. Without a video scope the widget renders a scopeless empty state.",
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof VideoDetailViewsPerformanceRender > &
		VideoDetailViewsPerformanceStoryControls
>;

export default meta;

type Story = StoryObj< VideoDetailViewsPerformanceStoryControls >;

/**
 * Default — the scoped video's four metric tabs for the selected period, with
 * the Views tab selected.
 */
export const Default: Story = {
	render: renderVideoDetailViewsPerformance,
	args: { hasVideoScope: true, interval: 'day', chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

/**
 * NoVideoScope — the widget without a `post_id` report param, as when added
 * outside a video detail page. Renders the scopeless empty state without
 * firing a stats request.
 */
export const NoVideoScope: Story = {
	render: renderVideoDetailViewsPerformance,
	args: { hasVideoScope: false, interval: 'day', chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

interface VideoDetailViewsPerformanceDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		VideoDetailViewsPerformanceStoryControls {}

/**
 * Mounts the real `WidgetDashboard` so the widget renders exactly as it does in
 * product. Passes comparison params unconditionally so it stays covered against
 * inventing an overlay when a host supplies comparison dates.
 */
function VideoDetailViewsPerformanceDashboardStory( {
	hasVideoScope,
	interval,
	chartType,
	...dashboardArgs
}: VideoDetailViewsPerformanceDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ VIDEO_DETAIL_VIEWS_PERFORMANCE_RENDER_MODULE }
			renderComponent={
				VideoDetailViewsPerformanceRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ getVideoDetailViewsPerformanceAttributes(
				{ hasVideoScope, interval, chartType },
				true
			) }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< VideoDetailViewsPerformanceDashboardStoryProps > =
	{
		render: args => <VideoDetailViewsPerformanceDashboardStory { ...args } />,
		args: {
			...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
			widgetWidth: 2,
			widgetHeight: 2,
			hasVideoScope: true,
			interval: 'day',
		},
		argTypes: {
			...widgetDashboardWithWidgetArgTypes,
			hasVideoScope: {
				control: 'boolean',
				description: 'Include the `post_id` report param the video detail page seeds from its URL.',
			},
			interval: {
				control: 'radio',
				options: [ 'day', 'week', 'month' ],
				description:
					'The page chart interval the widget buckets its daily history into. Monthly moves the story range to 90 days, the shortest preset that allows it.',
			},
		},
	};
