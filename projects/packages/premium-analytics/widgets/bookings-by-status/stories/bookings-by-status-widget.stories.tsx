import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import BookingsByStatusRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const BOOKINGS_BY_STATUS_RENDER_MODULE = 'storybook/bookings-by-status';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type BookingsByStatusRenderProps = ComponentProps< typeof BookingsByStatusRender >;

interface BookingsByStatusStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type BookingsByStatusStoryProps = BookingsByStatusRenderProps & BookingsByStatusStoryControls;

interface BookingsByStatusDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		BookingsByStatusStoryControls {}

function getBookingsByStatusAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): BookingsByStatusRenderProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< BookingsByStatusStoryControls > ) {
	const hasComparison = Boolean( withComparison );
	const storyPreset = preset ?? DEFAULT_PRESET;

	if ( ! hasComparison && storyPreset === DEFAULT_PRESET ) {
		return 'getDefaultQueryParams()';
	}

	if ( hasComparison && storyPreset === DEFAULT_PRESET ) {
		return 'getDefaultQueryParams( true )';
	}

	return `getDefaultQueryParams( ${ hasComparison ? 'true' : 'false' }, '${ storyPreset }' )`;
}

function getBookingsByStatusSource( args: Partial< BookingsByStatusStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<BookingsByStatusRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderBookingsByStatus( { withComparison, preset }: BookingsByStatusStoryControls ) {
	return (
		<BookingsByStatusRender
			attributes={ getBookingsByStatusAttributes( withComparison, preset ) }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderBookingsByStatusOnPreset( preset: SelectablePresetId ) {
	return <BookingsByStatusRender attributes={ getBookingsByStatusAttributes( false, preset ) } />;
}

function BookingsByStatusDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: BookingsByStatusDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ BOOKINGS_BY_STATUS_RENDER_MODULE }
			renderComponent={ BookingsByStatusRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison, preset ),
			} }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/BookingsByStatus',
	component: BookingsByStatusRender,
	tags: [ 'autodocs' ],
	argTypes: {
		preset: {
			control: 'select',
			options: PRESET_OPTIONS,
			description: 'Date-range preset used to generate the widget report params.',
		},
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'Dashboard widget that displays the bookings status breakdown for the selected period.',
			},
		},
	},
} satisfies Meta< BookingsByStatusStoryProps >;

export default meta;

type Story = StoryObj< BookingsByStatusStoryControls >;
type DashboardStory = StoryObj< BookingsByStatusDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderBookingsByStatus,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: false,
	},
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			source: {
				code: getBookingsByStatusSource( { withComparison: false, preset: DEFAULT_PRESET } ),
			},
		},
	},
};

/**
 * Current period with previous-period comparison data.
 */
export const WithComparison: Story = {
	render: renderBookingsByStatus,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: true,
	},
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			source: {
				code: getBookingsByStatusSource( { withComparison: true, preset: DEFAULT_PRESET } ),
			},
		},
	},
};

/**
 * First load: the bookings report is in flight, so the widget shows its
 * loading state. The mock is forced to never resolve for the duration of this
 * story.
 */
export const Loading: Story = {
	render: () => renderBookingsByStatusOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'bookings/by-date', 'loading' );
		return () => setReportMockState( 'bookings/by-date', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action
 * (which re-runs the query — still mocked as failing while this story is
 * active).
 */
export const Error: Story = {
	render: () => renderBookingsByStatusOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'bookings/by-date', 'error' );
		return () => setReportMockState( 'bookings/by-date', null );
	},
};

/**
 * Resolved with no bookings: the widget shows its empty state ("No bookings in
 * this period.").
 */
export const Empty: Story = {
	render: () => renderBookingsByStatusOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'bookings/by-date', 'empty' );
		return () => setReportMockState( 'bookings/by-date', null );
	},
};

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <BookingsByStatusDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		preset: DEFAULT_PRESET,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		preset: {
			control: 'select',
			options: PRESET_OPTIONS,
		},
		withComparison: {
			control: 'boolean',
		},
	},
};
