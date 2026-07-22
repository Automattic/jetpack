/**
 * The Video highlights widget is the video detail page's highlights card: the
 * selected video's views, impressions, hours watched, and retention rate as
 * metric tiles. The video scope arrives through `reportParams.post_id` (seeded
 * from the detail page URL in product); the `hasVideoScope` control toggles it
 * to exercise the scopeless empty state. All four tiles are period-scoped and
 * carry deltas when comparison is on; when the selected video has no
 * comparison row, the tiles keep the comparison layout without inventing a
 * vs-zero delta.
 *
 * Data comes from the proxied `stats/video-plays` complete-stats range
 * summary, covered by the shared report mocks' video-plays fixture.
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
import VideoDetailHighlightsRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

// Matches a video row in the shared video-plays complete-stats fixture so the
// scoped tiles resolve to real mock values.
const MOCK_VIDEO_ID = 105;

const VIDEO_DETAIL_HIGHLIGHTS_RENDER_MODULE = 'storybook/video-detail-highlights';

interface VideoDetailHighlightsStoryControls {
	withComparison: boolean;
	hasVideoScope: boolean;
}

/**
 * Builds the widget attributes: report params with the video scope the detail
 * page seeds from its URL when `hasVideoScope` is on.
 *
 * @param {VideoDetailHighlightsStoryControls} controls - The story controls.
 * @return The widget attributes.
 */
function getVideoDetailHighlightsAttributes( {
	withComparison,
	hasVideoScope,
}: VideoDetailHighlightsStoryControls ): ComponentProps<
	typeof VideoDetailHighlightsRender
>[ 'attributes' ] {
	return {
		reportParams: {
			...getDefaultQueryParams( withComparison ),
			...( hasVideoScope ? { post_id: MOCK_VIDEO_ID } : {} ),
		},
	};
}

/**
 * Renders the data-connected widget with the composed attributes.
 *
 * @param {VideoDetailHighlightsStoryControls} controls - The story controls.
 * @return The rendered widget.
 */
function renderVideoDetailHighlights( controls: VideoDetailHighlightsStoryControls ) {
	return (
		<VideoDetailHighlightsRender attributes={ getVideoDetailHighlightsAttributes( controls ) } />
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/VideoDetailHighlights',
	component: VideoDetailHighlightsRender,
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
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Video highlights" widget: the selected video\'s views, impressions, hours watched, and retention rate as metric tiles — the video detail page\'s highlights card. It uses the complete `stats/video-plays` range summary and shows period-over-period deltas when comparison is enabled. If the selected video has no comparison row, the tiles keep the comparison layout without inventing a vs-zero delta. Without a video scope the widget renders a scopeless empty state.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof VideoDetailHighlightsRender > & VideoDetailHighlightsStoryControls
>;

export default meta;

type Story = StoryObj< VideoDetailHighlightsStoryControls >;

/**
 * Default — the selected video's highlights for the primary period only; the
 * tiles show no deltas.
 */
export const Default: Story = {
	render: renderVideoDetailHighlights,
	args: { withComparison: false, hasVideoScope: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * WithComparison — the previous-period comparison from the date range picker;
 * each tile carries a delta computed from the selected video's comparison row.
 */
export const WithComparison: Story = {
	render: renderVideoDetailHighlights,
	args: { withComparison: true, hasVideoScope: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * NoVideoScope — the widget without a `post_id` report param, as when no video
 * is selected. Renders the scopeless empty state without firing a stats
 * request.
 */
export const NoVideoScope: Story = {
	render: renderVideoDetailHighlights,
	args: { withComparison: false, hasVideoScope: false },
	decorators: [ withWidgetCanvas ],
};

interface VideoDetailHighlightsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		VideoDetailHighlightsStoryControls {}

/**
 * Mounts the real `WidgetDashboard` with this single widget so it renders
 * exactly as it does in product (framed card, sizing, host environment).
 *
 * @param {VideoDetailHighlightsDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real dashboard.
 */
function VideoDetailHighlightsDashboardStory( {
	withComparison,
	hasVideoScope,
	...dashboardArgs
}: VideoDetailHighlightsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ VIDEO_DETAIL_HIGHLIGHTS_RENDER_MODULE }
			renderComponent={
				VideoDetailHighlightsRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ getVideoDetailHighlightsAttributes( { withComparison, hasVideoScope } ) }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< VideoDetailHighlightsDashboardStoryProps > = {
	render: args => <VideoDetailHighlightsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 4,
		widgetHeight: 1,
		withComparison: true,
		hasVideoScope: true,
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
	},
};
