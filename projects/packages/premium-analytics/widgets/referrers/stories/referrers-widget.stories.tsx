/**
 * External dependencies
 */
import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import { forceStatsMockState } from '../../stories/force-stats-mock-state';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import ReferrersRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const REFERRERS_RENDER_MODULE = 'storybook/referrers';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	presentation: 'framed' as const,
};

interface ReferrersStoryControls {
	withComparison: boolean;
}

interface ReferrersDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		ReferrersStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '340px' } }>
		<Story />
	</div>
);

function renderReferrersWidget( { withComparison }: ReferrersStoryControls ) {
	return (
		<ReferrersRender
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Renders the widget on a preset distinct from the other stories. The query key
// derives from the date range, so a unique preset gives the forced-state stories
// their own cache entry and they hit the mock fresh instead of reading another
// story's cached success from the shared query client.
function renderReferrersOnPreset( preset: PresetType ) {
	return (
		<ReferrersRender
			attributes={ { max: 10, reportParams: getDefaultQueryParams( false, preset ) } }
		/>
	);
}

function ReferrersDashboardStory( {
	withComparison,
	...dashboardArgs
}: ReferrersDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ REFERRERS_RENDER_MODULE }
			renderComponent={ ReferrersRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Referrers',
	component: ReferrersRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Referrers" widget. Shows the websites and search engines referring visitors to the site as a ranked leaderboard, using the global dashboard date range. Referrer groups drill down into their sources and domains; URL-backed leaf rows (no children) render as outbound links that open in a new tab, while rows that drill down remain buttons.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof ReferrersRender > & ReferrersStoryControls >;

export default meta;

type Story = StoryObj< ReferrersStoryControls >;
type DashboardStory = StoryObj< ReferrersDashboardStoryProps >;

export const Default: Story = {
	render: renderReferrersWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: Story = {
	render: renderReferrersWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 *
 * Forced through `forceStatsMockState`: `stats/referrers` is answered by the
 * legacy stats mocks before the shared `setReportMockState` override can
 * intercept it.
 */
export const Loading: Story = {
	render: () => renderReferrersOnPreset( 'last-90-days' ),
	// Kept off the shared autodocs page: the mock override is keyed by path, so it
	// would otherwise force the sibling stories on that page into the same state.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/referrers', 'loading' );
		return () => forceStatsMockState( 'stats/referrers', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderReferrersOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/referrers', 'error' );
		return () => forceStatsMockState( 'stats/referrers', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state (the neutral globe
 * glyph and "No referrers in this period.").
 */
export const Empty: Story = {
	render: () => renderReferrersOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/referrers', 'empty' );
		return () => forceStatsMockState( 'stats/referrers', null );
	},
};

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <ReferrersDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
	},
};
