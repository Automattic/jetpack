import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
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
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import TotalReturnsRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const TOTAL_RETURNS_RENDER_MODULE = 'storybook/total-returns';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type TotalReturnsWidgetProps = ComponentProps< typeof TotalReturnsRender >;
const noopSetError: TotalReturnsWidgetProps[ 'setError' ] = () => undefined;

interface TotalReturnsStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type TotalReturnsStoryProps = TotalReturnsWidgetProps & TotalReturnsStoryControls;

interface TotalReturnsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		TotalReturnsStoryControls {}

function getTotalReturnsAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): TotalReturnsWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function renderTotalReturns( { withComparison, preset }: TotalReturnsStoryControls ) {
	return (
		<TotalReturnsRender
			attributes={ getTotalReturnsAttributes( withComparison, preset ) }
			setError={ noopSetError }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderTotalReturnsOnPreset( preset: SelectablePresetId ) {
	return (
		<TotalReturnsRender
			attributes={ getTotalReturnsAttributes( false, preset ) }
			setError={ noopSetError }
		/>
	);
}

function TotalReturnsDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: TotalReturnsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ TOTAL_RETURNS_RENDER_MODULE }
			renderComponent={ TotalReturnsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getTotalReturnsAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/TotalReturns',
	component: TotalReturnsRender,
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
				component: 'Dashboard widget that displays refunds and net sales for the selected period.',
			},
		},
	},
} satisfies Meta< TotalReturnsStoryProps >;

export default meta;

type Story = StoryObj< TotalReturnsStoryControls >;
type DashboardStory = StoryObj< TotalReturnsDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderTotalReturns,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: false,
	},
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison period enabled, showing period-over-period change data.
 */
export const WithComparison: Story = {
	render: renderTotalReturns,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: true,
	},
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the orders report is in flight, so the widget shows its loading
 * state. The mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderTotalReturnsOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'orders/by-date', 'loading' );
		return () => setReportMockState( 'orders/by-date', null );
	},
};

/**
 * The orders report failed: the widget shows its error state with a Retry action
 * (which re-runs the query — still mocked as failing while this story is
 * active).
 */
export const Error: Story = {
	render: () => renderTotalReturnsOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'orders/by-date', 'error' );
		return () => setReportMockState( 'orders/by-date', null );
	},
};

/**
 * Resolved with no refunds in the period: the widget shows its empty state (the
 * neutral payment-return glyph and "No returns in this period.").
 */
export const Empty: Story = {
	render: () => renderTotalReturnsOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'orders/by-date', 'empty' );
		return () => setReportMockState( 'orders/by-date', null );
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <TotalReturnsDashboardStory { ...args } />,
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
};
