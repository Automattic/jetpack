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
import DevicesRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const DEVICES_RENDER_MODULE = 'storybook/devices';

// Pick only the fields that StoryWidgetMetadata accepts — the attribute schema
// and example arrays are typed differently in WidgetType and cause a type error.
const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	presentation: 'framed' as const,
};

interface DevicesStoryControls {
	withComparison: boolean;
}

interface DevicesDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		DevicesStoryControls {}

function renderDevicesWidget( { withComparison }: DevicesStoryControls ) {
	return (
		<DevicesRender
			attributes={ { max: 5, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderDevicesOnPreset( preset: PresetType ) {
	return (
		<DevicesRender
			attributes={ { max: 5, reportParams: getDefaultQueryParams( false, preset ) } }
		/>
	);
}

function DevicesDashboardRender( props: WidgetRenderProps< unknown > ) {
	return <DevicesRender { ...( props as ComponentProps< typeof DevicesRender > ) } />;
}

function DevicesDashboardStory( { withComparison, ...dashboardArgs }: DevicesDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ DEVICES_RENDER_MODULE }
			renderComponent={ DevicesDashboardRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { max: 5, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Devices',
	component: DevicesRender,
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
					'The "Devices" widget. Shows screen size breakdown (Desktop / Mobile / Tablet) as a semi-circle chart, using the global dashboard date range.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof DevicesRender > & DevicesStoryControls >;

export default meta;

type DashboardStory = StoryObj< DevicesDashboardStoryProps >;

export const Default: StoryObj< DevicesStoryControls > = {
	render: renderDevicesWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: StoryObj< DevicesStoryControls > = {
	render: renderDevicesWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: StoryObj< DevicesStoryControls > = {
	render: () => renderDevicesOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/devices/screensize', 'loading' );
		return () => forceStatsMockState( 'stats/devices/screensize', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: StoryObj< DevicesStoryControls > = {
	render: () => renderDevicesOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/devices/screensize', 'error' );
		return () => forceStatsMockState( 'stats/devices/screensize', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state (the neutral device
 * glyph and "No device data in this period.").
 */
export const Empty: StoryObj< DevicesStoryControls > = {
	render: () => renderDevicesOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/devices/screensize', 'empty' );
		return () => forceStatsMockState( 'stats/devices/screensize', null );
	},
};

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <DevicesDashboardStory { ...args } />,
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
