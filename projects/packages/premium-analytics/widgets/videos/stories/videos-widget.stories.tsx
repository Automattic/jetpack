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
import VideosRender from '../render';
import widgetDefinition, { DEFAULT_MAX } from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const VIDEOS_RENDER_MODULE = 'storybook/videos';

// Widget-specific story control: toggles the previous-period comparison.
interface VideosStoryControls {
	/**
	 * Whether to request the previous-period comparison.
	 */
	withComparison: boolean;
}

/**
 * Render the data-connected Videos widget with report params derived from the
 * `withComparison` control, so the close-up stories exercise the real data flow
 * (served by `registerReportMocks`).
 *
 * @param {VideosStoryControls} props - Story controls.
 * @return The rendered widget.
 */
function renderVideos( { withComparison }: VideosStoryControls ) {
	return (
		<VideosRender
			attributes={ { max: DEFAULT_MAX, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Close-up canvas so the leaderboard fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '360px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Videos',
	component: VideosRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					"Dashboard widget showing the site's most played videos as a leaderboard, sourced from the Jetpack Stats `video-plays` module via `useStatsVideoPlays`, with optional period-over-period comparison. In Storybook the data is served by `registerReportMocks`.",
			},
		},
	},
} satisfies Meta< ComponentProps< typeof VideosRender > & VideosStoryControls >;

export default meta;

type Story = StoryObj< VideosStoryControls >;

/**
 * The widget on its own, current period only.
 */
export const Default: Story = {
	render: renderVideos,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with each video's period-over-period delta (green for gains,
 * red for losses) driven by the mocked comparison window.
 */
export const WithComparison: Story = {
	render: renderVideos,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

interface VideosDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		VideosStoryControls {}

/**
 * Renders the real registered widget through the shared dashboard harness, so
 * it appears exactly as it does in product, inheriting the size / edit-mode /
 * host-environment controls.
 *
 * @param {VideosDashboardStoryProps} props - Story controls.
 * @return The widget mounted in the dashboard harness.
 */
function VideosDashboardStory( { withComparison, ...dashboardArgs }: VideosDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ widgetDefinition }
			renderModule={ VIDEOS_RENDER_MODULE }
			renderComponent={ VideosRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { max: DEFAULT_MAX, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< VideosDashboardStoryProps > = {
	render: args => <VideosDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
