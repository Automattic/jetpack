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
import LocationsRender from '../render';
import widgetDefinition, { type LocationsAttributes } from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps, WidgetType } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const LOCATIONS_RENDER_MODULE = 'storybook/locations';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	attributes: widgetDefinition.attributes as WidgetType[ 'attributes' ],
	example: widgetDefinition.example,
	presentation: 'framed' as const,
};

interface LocationsStoryControls {
	withComparison: boolean;
	geoGranularity: NonNullable< LocationsAttributes[ 'geoGranularity' ] >;
}

interface LocationsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		LocationsStoryControls {}

function getLocationsAttributes( {
	withComparison,
	geoGranularity,
}: LocationsStoryControls ): ComponentProps< typeof LocationsRender >[ 'attributes' ] {
	return {
		geoGranularity,
		max: 10,
		reportParams: getDefaultQueryParams( withComparison ),
	};
}

function renderLocationsWidget( controls: LocationsStoryControls ) {
	return <LocationsRender attributes={ getLocationsAttributes( controls ) } />;
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderLocationsOnPreset( preset: PresetType ) {
	return (
		<LocationsRender
			attributes={ {
				geoGranularity: 'country',
				max: 10,
				reportParams: getDefaultQueryParams( false, preset ),
			} }
		/>
	);
}

function LocationsDashboardRender( props: WidgetRenderProps< unknown > ) {
	return <LocationsRender { ...( props as ComponentProps< typeof LocationsRender > ) } />;
}

function LocationsDashboardStory( {
	withComparison,
	geoGranularity,
	...dashboardArgs
}: LocationsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ LOCATIONS_RENDER_MODULE }
			renderComponent={ LocationsDashboardRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getLocationsAttributes( { withComparison, geoGranularity } ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Locations',
	component: LocationsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
		geoGranularity: {
			control: 'radio',
			options: [ 'country', 'city' ],
			description: 'The "View by" toolbar attribute rendered by the widget host.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Locations" widget. Shows visitor views by country or city, with country drill-down into regions, using the global dashboard date range. The Countries/Cities view is the `geoGranularity` attribute (`relevance: \'high\'`), exposed as a control by the widget host.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof LocationsRender > & LocationsStoryControls >;

export default meta;

type DashboardStory = StoryObj< LocationsDashboardStoryProps >;

export const Default: StoryObj< LocationsStoryControls > = {
	render: renderLocationsWidget,
	args: { withComparison: false, geoGranularity: 'country' },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: StoryObj< LocationsStoryControls > = {
	render: renderLocationsWidget,
	args: { withComparison: true, geoGranularity: 'country' },
	decorators: [ withWidgetCanvas ],
};

// Cities mode — city rows in the leaderboard, aggregated by country on the map.
export const CitiesMode: StoryObj< LocationsStoryControls > = {
	render: renderLocationsWidget,
	args: { withComparison: false, geoGranularity: 'city' },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: StoryObj< LocationsStoryControls > = {
	render: () => renderLocationsOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/location-views', 'loading' );
		return () => forceStatsMockState( 'stats/location-views', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: StoryObj< LocationsStoryControls > = {
	render: () => renderLocationsOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/location-views', 'error' );
		return () => forceStatsMockState( 'stats/location-views', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state (the neutral location
 * glyph and the "stats will appear here" copy).
 */
export const Empty: StoryObj< LocationsStoryControls > = {
	render: () => renderLocationsOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/location-views', 'empty' );
		return () => forceStatsMockState( 'stats/location-views', null );
	},
};

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <LocationsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 2,
		widgetHeight: 1,
		withComparison: true,
		geoGranularity: 'country',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
		geoGranularity: {
			control: 'radio',
			options: [ 'country', 'city' ],
			description: 'The "View by" toolbar attribute rendered by the widget host.',
		},
	},
};
