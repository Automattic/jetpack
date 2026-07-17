import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import { forceStatsMockState } from '../../stories/force-stats-mock-state';
import TopPlatformsRender from '../render';
import widgetDefinition, { type TopPlatformsAttributes } from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps, WidgetType } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const TOP_PLATFORMS_RENDER_MODULE = 'storybook/top-platforms';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	// attributes/example let the dashboard host render the real "View by"
	// toolbar control for the `relevance: 'high'` attribute, as in Locations.
	attributes: widgetDefinition.attributes as WidgetType[ 'attributes' ],
	example: widgetDefinition.example,
	presentation: 'framed' as const,
};

interface TopPlatformsStoryControls {
	withComparison: boolean;
	platformDimension: NonNullable< TopPlatformsAttributes[ 'platformDimension' ] >;
}

interface TopPlatformsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		TopPlatformsStoryControls {}

function getTopPlatformsAttributes( {
	withComparison,
	platformDimension,
}: TopPlatformsStoryControls ): ComponentProps< typeof TopPlatformsRender >[ 'attributes' ] {
	return {
		max: 10,
		platformDimension,
		reportParams: getDefaultQueryParams( withComparison ),
	};
}

function renderTopPlatformsWidget( controls: TopPlatformsStoryControls ) {
	return <TopPlatformsRender attributes={ getTopPlatformsAttributes( controls ) } />;
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderTopPlatformsOnPreset( preset: PresetType ) {
	return (
		<TopPlatformsRender
			attributes={ {
				max: 10,
				platformDimension: 'browser',
				reportParams: getDefaultQueryParams( false, preset ),
			} }
		/>
	);
}

function TopPlatformsDashboardRender( props: WidgetRenderProps< unknown > ) {
	return <TopPlatformsRender { ...( props as ComponentProps< typeof TopPlatformsRender > ) } />;
}

function TopPlatformsDashboardStory( {
	withComparison,
	platformDimension,
	...dashboardArgs
}: TopPlatformsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ TOP_PLATFORMS_RENDER_MODULE }
			renderComponent={
				TopPlatformsDashboardRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ getTopPlatformsAttributes( { withComparison, platformDimension } ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/TopPlatforms',
	component: TopPlatformsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
		platformDimension: {
			control: 'radio',
			options: [ 'browser', 'platform' ],
			description: 'The "View by" toolbar attribute rendered by the widget host.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Top Platforms" widget. Shows browser and OS breakdown as a ranked leaderboard. The active dimension is the `platformDimension` attribute (`relevance: \'high\'`), exposed as a control by the widget host.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof TopPlatformsRender > & TopPlatformsStoryControls >;

export default meta;

type DashboardStory = StoryObj< TopPlatformsDashboardStoryProps >;

export const Default: StoryObj< TopPlatformsStoryControls > = {
	render: renderTopPlatformsWidget,
	args: { withComparison: false, platformDimension: 'browser' },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: StoryObj< TopPlatformsStoryControls > = {
	render: renderTopPlatformsWidget,
	args: { withComparison: true, platformDimension: 'browser' },
	decorators: [ withWidgetCanvas ],
};

// OS view — the `platformDimension` attribute set to operating systems.
export const ByOS: StoryObj< TopPlatformsStoryControls > = {
	render: renderTopPlatformsWidget,
	args: { withComparison: false, platformDimension: 'platform' },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: StoryObj< TopPlatformsStoryControls > = {
	render: () => renderTopPlatformsOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/devices', 'loading' );
		return () => forceStatsMockState( 'stats/devices', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: StoryObj< TopPlatformsStoryControls > = {
	render: () => renderTopPlatformsOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/devices', 'error' );
		return () => forceStatsMockState( 'stats/devices', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state (the neutral device
 * glyph and "No platform data in this period.").
 */
export const Empty: StoryObj< TopPlatformsStoryControls > = {
	render: () => renderTopPlatformsOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/devices', 'empty' );
		return () => forceStatsMockState( 'stats/devices', null );
	},
};

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <TopPlatformsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
		platformDimension: 'browser',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
		platformDimension: {
			control: 'radio',
			options: [ 'browser', 'platform' ],
			description: 'The "View by" toolbar attribute rendered by the widget host.',
		},
	},
};
