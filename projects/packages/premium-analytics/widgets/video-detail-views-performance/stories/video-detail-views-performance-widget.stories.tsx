/**
 * The Views performance widget is the video detail page's view-trend card:
 * the scoped video's views over the dashboard date range as a comparative
 * line chart. The video scope arrives through `reportParams.post_id` (seeded
 * from the detail page URL in product); the `hasVideoScope` control toggles
 * it to exercise the scopeless empty state.
 *
 * Data comes from the proxied `stats/video/{id}` `statType=all` endpoint —
 * the same range request the Video highlights widget issues, so the two share
 * one cache entry — covered by the shared single-video report mock (a
 * deterministic daily series ending today, so relative date presets always
 * intersect it). The comparison overlay is fetched with a second
 * window-scoped request.
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
import VideoDetailViewsPerformanceRender from '../render';
import widgetDefinition, { type VideoDetailViewsPerformanceGranularity } from '../widget';
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
	withComparison: boolean;
	hasVideoScope: boolean;
	granularity: VideoDetailViewsPerformanceGranularity;
}

/**
 * Builds the widget attributes: the granularity attribute plus report params
 * with the video scope the detail page seeds from its URL when
 * `hasVideoScope` is on.
 *
 * @param {VideoDetailViewsPerformanceStoryControls} controls - The story controls.
 * @return The widget attributes.
 */
function getVideoDetailViewsPerformanceAttributes( {
	withComparison,
	hasVideoScope,
	granularity,
}: VideoDetailViewsPerformanceStoryControls ): ComponentProps<
	typeof VideoDetailViewsPerformanceRender
>[ 'attributes' ] {
	return {
		granularity,
		reportParams: {
			...getDefaultQueryParams( withComparison ),
			...( hasVideoScope ? { post_id: MOCK_VIDEO_ID } : {} ),
		},
	};
}

/**
 * Renders the data-connected widget with the composed attributes.
 *
 * @param {VideoDetailViewsPerformanceStoryControls} controls - The story controls.
 * @return The rendered widget.
 */
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
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
		hasVideoScope: {
			control: 'boolean',
			description: 'Include the `post_id` report param the video detail page seeds from its URL.',
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
					'The "Views performance" widget: the scoped video\'s view trend over the dashboard date range as a comparative line chart. The series comes from the `stats/video/{id}` daily history for the selected window, zero-filled and bucketed client-side per the host-rendered "Group by" control, with the comparison overlay fetched as a second window-scoped request. Without a video scope the widget renders a scopeless empty state.',
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
 * Default — the scoped video's views for the primary period only: a single
 * "Views" line with no overlay.
 */
export const Default: Story = {
	render: renderVideoDetailViewsPerformance,
	args: { withComparison: false, hasVideoScope: true, granularity: 'day' },
	decorators: [ withWidgetCanvas ],
};

/**
 * WithComparison — the previous-period comparison from the date range picker;
 * the chart adds a dashed previous-period overlay and the legend switches to
 * date-range labels.
 */
export const WithComparison: Story = {
	render: renderVideoDetailViewsPerformance,
	args: { withComparison: true, hasVideoScope: true, granularity: 'day' },
	decorators: [ withWidgetCanvas ],
};

/**
 * NoVideoScope — the widget without a `post_id` report param, as when added
 * outside a video detail page. Renders the scopeless empty state without
 * firing a stats request.
 */
export const NoVideoScope: Story = {
	render: renderVideoDetailViewsPerformance,
	args: { withComparison: false, hasVideoScope: false, granularity: 'day' },
	decorators: [ withWidgetCanvas ],
};

interface VideoDetailViewsPerformanceDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		VideoDetailViewsPerformanceStoryControls {}

/**
 * Mounts the real `WidgetDashboard` with this single widget so it renders
 * exactly as it does in product (framed card, host "Group by" toolbar
 * control, sizing, edit mode).
 *
 * @param {VideoDetailViewsPerformanceDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real dashboard.
 */
function VideoDetailViewsPerformanceDashboardStory( {
	withComparison,
	hasVideoScope,
	granularity,
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
			attributes={ getVideoDetailViewsPerformanceAttributes( {
				withComparison,
				hasVideoScope,
				granularity,
			} ) }
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
			withComparison: true,
			hasVideoScope: true,
			granularity: 'day',
		},
		argTypes: {
			...widgetDashboardWithWidgetArgTypes,
			withComparison: {
				control: 'boolean',
				description: 'Include previous-period comparison report params.',
			},
			hasVideoScope: {
				control: 'boolean',
				description: 'Include the `post_id` report param the video detail page seeds from its URL.',
			},
			granularity: {
				control: 'radio',
				options: [ 'day', 'week', 'month' ],
				description: 'The "Group by" toolbar attribute rendered by the widget host.',
			},
		},
	};
