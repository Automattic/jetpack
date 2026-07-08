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
import VideoPressRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const VIDEOPRESS_RENDER_MODULE = 'storybook/videopress';

const DEFAULT_MAX = 7;

// Widget-specific story control: toggles the previous-period comparison.
interface VideoPressStoryControls {
	/**
	 * Whether to request the previous-period comparison.
	 */
	withComparison: boolean;
}

/**
 * Render the data-connected VideoPress widget with report params derived from
 * the `withComparison` control, so the close-up stories exercise the real data
 * flow (served by `registerReportMocks`).
 *
 * @param {VideoPressStoryControls} props - Story controls.
 * @return The rendered widget.
 */
function renderVideoPress( { withComparison }: VideoPressStoryControls ) {
	return (
		<VideoPressRender
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
	title: 'Packages/Premium Analytics/Widgets/VideoPress',
	component: VideoPressRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					"Dashboard widget showing the site's most played VideoPress videos as a leaderboard, sourced from the Jetpack Stats `video-plays` module via `useStatsVideoPlays`, with optional period-over-period comparison. In Storybook the data is served by `registerReportMocks`.",
			},
		},
	},
} satisfies Meta< ComponentProps< typeof VideoPressRender > & VideoPressStoryControls >;

export default meta;

type Story = StoryObj< VideoPressStoryControls >;

/**
 * The widget on its own, current period only.
 */
export const Default: Story = {
	render: renderVideoPress,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with each video's period-over-period delta (green for gains,
 * red for losses) driven by the mocked comparison window.
 */
export const WithComparison: Story = {
	render: renderVideoPress,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

interface VideoPressDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		VideoPressStoryControls {}

/**
 * Renders the real registered widget through the shared dashboard harness, so
 * it appears exactly as it does in product, inheriting the size / edit-mode /
 * host-environment controls.
 *
 * @param {VideoPressDashboardStoryProps} props - Story controls.
 * @return The widget mounted in the dashboard harness.
 */
function VideoPressDashboardStory( {
	withComparison,
	...dashboardArgs
}: VideoPressDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ widgetDefinition }
			renderModule={ VIDEOPRESS_RENDER_MODULE }
			renderComponent={ VideoPressRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { max: DEFAULT_MAX, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< VideoPressDashboardStoryProps > = {
	render: args => <VideoPressDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
