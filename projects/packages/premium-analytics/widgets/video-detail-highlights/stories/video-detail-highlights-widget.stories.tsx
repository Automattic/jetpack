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
import VideoDetailHighlightsRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const MOCK_VIDEO_ID = 105;
const VIDEO_DETAIL_HIGHLIGHTS_RENDER_MODULE = 'storybook/video-detail-highlights';

interface VideoDetailHighlightsStoryControls {
	withComparison: boolean;
}

function getVideoReportParams( withComparison: boolean ) {
	return {
		...getDefaultQueryParams( withComparison ),
		post_id: MOCK_VIDEO_ID,
	};
}

function renderVideoDetailHighlights( { withComparison }: VideoDetailHighlightsStoryControls ) {
	return (
		<VideoDetailHighlightsRender
			attributes={ { reportParams: getVideoReportParams( withComparison ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/VideoDetailHighlights',
	component: VideoDetailHighlightsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Video highlights" widget shows views, impressions, hours watched, and retention rate for the video selected through `reportParams.post_id`. It uses the complete `stats/video-plays` range summary and shows period-over-period deltas when comparison is enabled. If the selected video has no comparison row, the tiles keep the comparison layout without inventing a vs-zero delta.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof VideoDetailHighlightsRender > & VideoDetailHighlightsStoryControls
>;

export default meta;

type Story = StoryObj< VideoDetailHighlightsStoryControls >;

export const Default: Story = {
	render: renderVideoDetailHighlights,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: Story = {
	render: renderVideoDetailHighlights,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

interface VideoDetailHighlightsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		VideoDetailHighlightsStoryControls {}

function VideoDetailHighlightsDashboardStory( {
	withComparison,
	...dashboardArgs
}: VideoDetailHighlightsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ widgetDefinition }
			renderModule={ VIDEO_DETAIL_HIGHLIGHTS_RENDER_MODULE }
			renderComponent={
				VideoDetailHighlightsRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ { reportParams: getVideoReportParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< VideoDetailHighlightsDashboardStoryProps > = {
	render: args => <VideoDetailHighlightsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
