/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withStoryRouter } from '../../stories/with-story-router';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import AnnualHighlightsRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const ANNUAL_HIGHLIGHTS_RENDER_MODULE = 'storybook/annual-highlights';

// Carries the widget's metadata, including the year attribute schema, so the
// dashboard story's frame header renders the real year dropdown.
const storyWidgetType = createStoryWidgetType( widgetManifest, widgetDefinition );

function renderAnnualHighlights() {
	return <AnnualHighlightsRender attributes={ { reportParams: getDefaultQueryParams() } } />;
}

/**
 * Forces the insights request into a loading/error/empty state for a story. The
 * insights query key carries no date params, so only evicting it from the shared
 * client keeps a forced result from leaking into sibling stories.
 */
function forceInsightsState( state: 'loading' | 'error' | 'empty' ) {
	setReportMockState( 'stats/insights', state );
	queryClient.removeQueries( { queryKey: [ 'stats', 'insights' ] } );
	return () => {
		setReportMockState( 'stats/insights', null );
		queryClient.removeQueries( { queryKey: [ 'stats', 'insights' ] } );
	};
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/AnnualHighlights',
	component: AnnualHighlightsRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					"The \"Year in review\" widget. Shows one year's totals — posts, words, likes, and comments — as a grid of metric tiles. The year is the `year` attribute (`relevance: 'high'`), so the host renders its dropdown in the frame header; its entries run from the current year back to the site's oldest year of data, and an instance that never had one picked shows the current year. The insights endpoint returns every year in one request, so switching years is a client-side row pick with no new fetch; the section's date selection plays no part. Data comes from the designated `useStatsInsights` hook; in Storybook it is served by `registerReportMocks()` (the `stats/insights` handler in `routeStatsReport`, whose mock carries the current and previous year). The insights module has no comparison period, so the tiles show bare counts. The close-up stories below render the body alone — the year dropdown belongs to the host, so it appears in the dashboard story.",
			},
		},
	},
} satisfies Meta< typeof AnnualHighlightsRender >;

export default meta;

type Story = StoryObj< Partial< ComponentProps< typeof AnnualHighlightsRender > > >;

/**
 * The widget body on its own, populated from the mocked insights payload for
 * the current year.
 */
export const Default: Story = {
	render: renderAnnualHighlights,
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderAnnualHighlights,
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => forceInsightsState( 'loading' ),
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: renderAnnualHighlights,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => forceInsightsState( 'error' ),
};

/**
 * Resolved with no years: the widget shows its empty state (the neutral calendar
 * glyph and "No highlights for this year.").
 */
export const Empty: Story = {
	render: renderAnnualHighlights,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => forceInsightsState( 'empty' ),
};

function AnnualHighlightsDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ ANNUAL_HIGHLIGHTS_RENDER_MODULE }
			renderComponent={ AnnualHighlightsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				// The widget ignores report params; this story covers that it keeps
				// doing so when the host supplies them.
				reportParams: getDefaultQueryParams( true ),
			} }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <AnnualHighlightsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 1,
		widgetHeight: 1,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
	decorators: [ withStoryRouter ],
};
