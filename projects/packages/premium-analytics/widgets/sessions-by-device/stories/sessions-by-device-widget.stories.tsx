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
import SessionsByDeviceRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SESSIONS_BY_DEVICE_RENDER_MODULE = 'storybook/sessions-by-device';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type SessionsByDeviceWidgetProps = ComponentProps< typeof SessionsByDeviceRender >;

interface SessionsByDeviceStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type SessionsByDeviceStoryProps = SessionsByDeviceWidgetProps & SessionsByDeviceStoryControls;

interface SessionsByDeviceDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		SessionsByDeviceStoryControls {}

function getSessionsByDeviceAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): SessionsByDeviceWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< SessionsByDeviceStoryControls > ) {
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

function getSessionsByDeviceSource( args: Partial< SessionsByDeviceStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<SessionsByDeviceRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderSessionsByDevice( { withComparison, preset }: SessionsByDeviceStoryControls ) {
	return (
		<SessionsByDeviceRender
			attributes={ getSessionsByDeviceAttributes( withComparison, preset ) }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderSessionsByDeviceOnPreset( preset: SelectablePresetId ) {
	return <SessionsByDeviceRender attributes={ getSessionsByDeviceAttributes( false, preset ) } />;
}

function SessionsByDeviceDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: SessionsByDeviceDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ SESSIONS_BY_DEVICE_RENDER_MODULE }
			renderComponent={ SessionsByDeviceRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getSessionsByDeviceAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/SessionsByDevice',
	component: SessionsByDeviceRender,
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
					'Dashboard widget that displays sessions by device type for the selected period.',
			},
		},
	},
} satisfies Meta< SessionsByDeviceStoryProps >;

export default meta;

type Story = StoryObj< SessionsByDeviceStoryControls >;
type DashboardStory = StoryObj< SessionsByDeviceDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderSessionsByDevice,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: false,
	},
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			source: {
				transform: (
					_source: string,
					storyContext: { args: Partial< SessionsByDeviceStoryControls > }
				) => getSessionsByDeviceSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing previous-period context in the widget data.
 */
export const WithComparison: Story = {
	render: renderSessionsByDevice,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: true,
	},
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			source: {
				transform: (
					_source: string,
					storyContext: { args: Partial< SessionsByDeviceStoryControls > }
				) => getSessionsByDeviceSource( storyContext.args ),
			},
		},
	},
};

/**
 * First load: the sessions-by-device report is in flight, so the widget shows
 * its loading state. The mock is forced to never resolve for the duration of
 * this story.
 */
export const Loading: Story = {
	render: () => renderSessionsByDeviceOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'sessions/by-device', 'loading' );
		return () => setReportMockState( 'sessions/by-device', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action
 * (which re-runs the query — still mocked as failing while this story is
 * active).
 */
export const Error: Story = {
	render: () => renderSessionsByDeviceOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'sessions/by-device', 'error' );
		return () => setReportMockState( 'sessions/by-device', null );
	},
};

/**
 * Resolved with no sessions: the widget shows its empty state ("No session
 * data in this period.").
 */
export const Empty: Story = {
	render: () => renderSessionsByDeviceOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'sessions/by-device', 'empty' );
		return () => setReportMockState( 'sessions/by-device', null );
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <SessionsByDeviceDashboardStory { ...args } />,
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
			description: 'Date-range preset used to generate the widget report params.',
		},
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
	},
	parameters: {
		docs: {
			source: {
				code: `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<WidgetDashboardWithWidget
\twidgetType={ widgetDefinition }
\trenderModule="storybook/sessions-by-device"
\trenderComponent={ SessionsByDeviceRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
