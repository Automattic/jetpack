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
import RevenueByCustomerTypeRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const REVENUE_BY_CUSTOMER_TYPE_RENDER_MODULE = 'storybook/revenue-by-customer-type';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type RevenueByCustomerTypeRenderProps = ComponentProps< typeof RevenueByCustomerTypeRender >;

interface RevenueByCustomerTypeStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type RevenueByCustomerTypeStoryProps = RevenueByCustomerTypeRenderProps &
	RevenueByCustomerTypeStoryControls;

interface RevenueByCustomerTypeDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		RevenueByCustomerTypeStoryControls {}

function getRevenueByCustomerTypeAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): RevenueByCustomerTypeRenderProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< RevenueByCustomerTypeStoryControls > ) {
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

function getRevenueByCustomerTypeSource( args: Partial< RevenueByCustomerTypeStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<RevenueByCustomerTypeRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderRevenueByCustomerType( {
	withComparison,
	preset,
}: RevenueByCustomerTypeStoryControls ) {
	return (
		<RevenueByCustomerTypeRender
			attributes={ getRevenueByCustomerTypeAttributes( withComparison, preset ) }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderRevenueByCustomerTypeOnPreset( preset: SelectablePresetId ) {
	return (
		<RevenueByCustomerTypeRender
			attributes={ getRevenueByCustomerTypeAttributes( false, preset ) }
		/>
	);
}

function RevenueByCustomerTypeDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: RevenueByCustomerTypeDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ REVENUE_BY_CUSTOMER_TYPE_RENDER_MODULE }
			renderComponent={
				RevenueByCustomerTypeRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ getRevenueByCustomerTypeAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/RevenueByCustomerType',
	component: RevenueByCustomerTypeRender,
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
					'Dashboard widget that displays new and returning customer revenue for the selected period.',
			},
		},
	},
} satisfies Meta< RevenueByCustomerTypeStoryProps >;

export default meta;

type Story = StoryObj< RevenueByCustomerTypeStoryControls >;
type DashboardStory = StoryObj< RevenueByCustomerTypeDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderRevenueByCustomerType,
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
					storyContext: { args: Partial< RevenueByCustomerTypeStoryControls > }
				) => getRevenueByCustomerTypeSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period revenue changes.
 */
export const WithComparison: Story = {
	render: renderRevenueByCustomerType,
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
					storyContext: { args: Partial< RevenueByCustomerTypeStoryControls > }
				) => getRevenueByCustomerTypeSource( storyContext.args ),
			},
		},
	},
};

/**
 * First load: the customers report is in flight, so the widget shows its
 * loading state. The mock is forced to never resolve for the duration of this
 * story.
 */
export const Loading: Story = {
	render: () => renderRevenueByCustomerTypeOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'customers/new-returning', 'loading' );
		return () => setReportMockState( 'customers/new-returning', null );
	},
};

/**
 * The customers report failed: the widget shows its error state with a Retry
 * action (which re-runs the query — still mocked as failing while this story is
 * active).
 */
export const Error: Story = {
	render: () => renderRevenueByCustomerTypeOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'customers/new-returning', 'error' );
		return () => setReportMockState( 'customers/new-returning', null );
	},
};

/**
 * The customers report resolved with no revenue in the period: the widget shows
 * its empty state.
 */
export const Empty: Story = {
	render: () => renderRevenueByCustomerTypeOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'customers/new-returning', 'empty' );
		return () => setReportMockState( 'customers/new-returning', null );
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <RevenueByCustomerTypeDashboardStory { ...args } />,
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
\trenderModule="storybook/revenue-by-customer-type"
\trenderComponent={ RevenueByCustomerTypeRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
