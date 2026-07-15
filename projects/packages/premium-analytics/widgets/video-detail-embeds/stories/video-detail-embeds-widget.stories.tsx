/**
 * External dependencies
 */
import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
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
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import VideoDetailEmbedsRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const VIDEO_DETAIL_EMBEDS_RENDER_MODULE = 'storybook/video-detail-embeds';

// The single-video endpoint path fragment the forced-state stories override.
// The trailing slash keeps it from matching `stats/video-plays`.
const SINGLE_VIDEO_PATH_FRAGMENT = 'stats/video/';

// A stand-in VideoPress post ID. The widget has no meaning without a selected
// video, so the host scopes it through `reportParams.post_id`; the mocked
// `stats/video/{id}` endpoint returns the same fixture for any ID.
const MOCK_VIDEO_ID = 105;

// Widget-specific story control: toggles the previous-period comparison params.
interface VideoDetailEmbedsStoryControls {
	/**
	 * Whether to request the previous-period comparison.
	 */
	withComparison: boolean;
}

/**
 * Builds the host-composed report params for the selected video, deriving the
 * date range / comparison from the `withComparison` control.
 *
 * @param {boolean}    withComparison - Whether to include comparison params.
 * @param {PresetType} preset         - Optional date preset override.
 * @return The report params with the single-video `post_id` scope.
 */
function reportParamsForVideo( withComparison: boolean, preset?: PresetType ) {
	return { ...getDefaultQueryParams( withComparison, preset ), post_id: MOCK_VIDEO_ID };
}

/**
 * Render the data-connected widget with report params derived from the
 * `withComparison` control, so the close-up stories exercise the real data flow
 * (served by `registerReportMocks`).
 *
 * @param {VideoDetailEmbedsStoryControls} props - Story controls.
 * @return The rendered widget.
 */
function renderVideoDetailEmbeds( { withComparison }: VideoDetailEmbedsStoryControls ) {
	return (
		<VideoDetailEmbedsRender
			attributes={ { reportParams: reportParamsForVideo( withComparison ) } }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderVideoDetailEmbedsOnPreset( preset: PresetType ) {
	return (
		<VideoDetailEmbedsRender
			attributes={ { reportParams: reportParamsForVideo( false, preset ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/VideoDetailEmbeds',
	component: VideoDetailEmbedsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'Dashboard widget listing the pages where a single video is embedded, sourced from the Jetpack Stats `stats/video/%d` module via `useStatsSingleVideo`. The widget is scoped to one video through the host-composed `reportParams.post_id`; without one it prompts to select a video. The single-video module has no comparison data, so the `WithComparison` control only exercises that the widget still renders normally when comparison params are present. In Storybook the data is served by `registerReportMocks`.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof VideoDetailEmbedsRender > & VideoDetailEmbedsStoryControls
>;

export default meta;

type Story = StoryObj< VideoDetailEmbedsStoryControls >;

/**
 * The widget on its own, current period only.
 */
export const Default: Story = {
	render: renderVideoDetailEmbeds,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with comparison report params. The single-video module returns
 * no comparison rows, so the list renders normally without fabricated deltas.
 */
export const WithComparison: Story = {
	render: renderVideoDetailEmbeds,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * No video scoped through `reportParams.post_id`: the query stays disabled and
 * the widget prompts to select a video instead of fetching.
 */
export const NoVideoSelected: Story = {
	render: () => (
		<VideoDetailEmbedsRender attributes={ { reportParams: getDefaultQueryParams( false ) } } />
	),
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderVideoDetailEmbedsOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( SINGLE_VIDEO_PATH_FRAGMENT, 'loading' );
		return () => setReportMockState( SINGLE_VIDEO_PATH_FRAGMENT, null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderVideoDetailEmbedsOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( SINGLE_VIDEO_PATH_FRAGMENT, 'error' );
		return () => setReportMockState( SINGLE_VIDEO_PATH_FRAGMENT, null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state ("This video has not
 * been embedded on any pages yet.").
 */
export const Empty: Story = {
	render: () => renderVideoDetailEmbedsOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( SINGLE_VIDEO_PATH_FRAGMENT, 'empty' );
		return () => setReportMockState( SINGLE_VIDEO_PATH_FRAGMENT, null );
	},
};

interface VideoDetailEmbedsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		VideoDetailEmbedsStoryControls {}

/**
 * Renders the real registered widget through the shared dashboard harness, so
 * it appears exactly as it does in product, inheriting the size / edit-mode /
 * host-environment controls.
 *
 * @param {VideoDetailEmbedsDashboardStoryProps} props - Story controls.
 * @return The widget mounted in the dashboard harness.
 */
function VideoDetailEmbedsDashboardStory( {
	withComparison,
	...dashboardArgs
}: VideoDetailEmbedsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ widgetDefinition }
			renderModule={ VIDEO_DETAIL_EMBEDS_RENDER_MODULE }
			renderComponent={ VideoDetailEmbedsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: reportParamsForVideo( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< VideoDetailEmbedsDashboardStoryProps > = {
	render: args => <VideoDetailEmbedsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
