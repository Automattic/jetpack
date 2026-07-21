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
import SalesByUtmSourceRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SALES_BY_UTM_SOURCE_RENDER_MODULE = 'storybook/sales-by-utm-source';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type SalesByUtmSourceWidgetProps = ComponentProps< typeof SalesByUtmSourceRender >;

interface SalesByUtmSourceStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type SalesByUtmSourceStoryProps = SalesByUtmSourceWidgetProps & SalesByUtmSourceStoryControls;

interface SalesByUtmSourceDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		SalesByUtmSourceStoryControls {}

function getSalesByUtmSourceAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): SalesByUtmSourceWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< SalesByUtmSourceStoryControls > ) {
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

function getSalesByUtmSourceSource( args: Partial< SalesByUtmSourceStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<SalesByUtmSourceRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderSalesByUtmSource( { withComparison, preset }: SalesByUtmSourceStoryControls ) {
	return (
		<SalesByUtmSourceRender
			attributes={ getSalesByUtmSourceAttributes( withComparison, preset ) }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderSalesByUtmSourceOnPreset( preset: SelectablePresetId ) {
	return <SalesByUtmSourceRender attributes={ getSalesByUtmSourceAttributes( false, preset ) } />;
}

function SalesByUtmSourceDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: SalesByUtmSourceDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ SALES_BY_UTM_SOURCE_RENDER_MODULE }
			renderComponent={ SalesByUtmSourceRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getSalesByUtmSourceAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/SalesByUtmSource',
	component: SalesByUtmSourceRender,
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
					'Dashboard widget that displays top UTM sources by order revenue for the selected period.',
			},
		},
	},
} satisfies Meta< SalesByUtmSourceStoryProps >;

export default meta;

type Story = StoryObj< SalesByUtmSourceStoryControls >;
type DashboardStory = StoryObj< SalesByUtmSourceDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderSalesByUtmSource,
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
					storyContext: { args: Partial< SalesByUtmSourceStoryControls > }
				) => getSalesByUtmSourceSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period change and trend data.
 */
export const WithComparison: Story = {
	render: renderSalesByUtmSource,
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
					storyContext: { args: Partial< SalesByUtmSourceStoryControls > }
				) => getSalesByUtmSourceSource( storyContext.args ),
			},
		},
	},
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderSalesByUtmSourceOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'order-attribution/source/summary', 'loading' );
		return () => setReportMockState( 'order-attribution/source/summary', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderSalesByUtmSourceOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'order-attribution/source/summary', 'error' );
		return () => setReportMockState( 'order-attribution/source/summary', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state ("No attribution data
 * in this period.").
 */
export const Empty: Story = {
	render: () => renderSalesByUtmSourceOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'order-attribution/source/summary', 'empty' );
		return () => setReportMockState( 'order-attribution/source/summary', null );
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <SalesByUtmSourceDashboardStory { ...args } />,
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
\trenderModule="storybook/sales-by-utm-source"
\trenderComponent={ SalesByUtmSourceRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
