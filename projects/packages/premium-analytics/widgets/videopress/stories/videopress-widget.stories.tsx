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
import VideoPressRender from '../render';
import widgetDefinition, { DEFAULT_MAX } from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const VIDEOPRESS_RENDER_MODULE = 'storybook/videopress';

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

// Renders the widget on a preset distinct from the other stories. The query key
// derives from the date range, so a unique preset gives the forced-state stories
// their own cache entry and they hit the mock fresh instead of reading another
// story's cached success from the shared query client.
function renderVideoPressOnPreset( preset: PresetType ) {
	return (
		<VideoPressRender
			attributes={ { max: DEFAULT_MAX, reportParams: getDefaultQueryParams( false, preset ) } }
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

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderVideoPressOnPreset( 'last-90-days' ),
	// Kept off the shared autodocs page: the mock override is keyed by path, so it
	// would otherwise force the sibling stories on that page into the same state.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/video-plays', 'loading' );
		return () => setReportMockState( 'stats/video-plays', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderVideoPressOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/video-plays', 'error' );
		return () => setReportMockState( 'stats/video-plays', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state (the video glyph and
 * the "learn which videos your visitors watch most" hint).
 */
export const Empty: Story = {
	render: () => renderVideoPressOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/video-plays', 'empty' );
		return () => setReportMockState( 'stats/video-plays', null );
	},
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
