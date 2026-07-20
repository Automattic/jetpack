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
import PaymentStatusRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const PAYMENT_STATUS_RENDER_MODULE = 'storybook/payment-status';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type PaymentStatusWidgetProps = ComponentProps< typeof PaymentStatusRender >;

interface PaymentStatusStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type PaymentStatusStoryProps = PaymentStatusWidgetProps & PaymentStatusStoryControls;

interface PaymentStatusDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		PaymentStatusStoryControls {}

function getPaymentStatusAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): PaymentStatusWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< PaymentStatusStoryControls > ) {
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

function getPaymentStatusSource( args: Partial< PaymentStatusStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<PaymentStatusRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderPaymentStatus( { withComparison, preset }: PaymentStatusStoryControls ) {
	return (
		<PaymentStatusRender attributes={ getPaymentStatusAttributes( withComparison, preset ) } />
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderPaymentStatusOnPreset( preset: SelectablePresetId ) {
	return <PaymentStatusRender attributes={ getPaymentStatusAttributes( false, preset ) } />;
}

function PaymentStatusDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: PaymentStatusDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ PAYMENT_STATUS_RENDER_MODULE }
			renderComponent={ PaymentStatusRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getPaymentStatusAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PaymentStatus',
	component: PaymentStatusRender,
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
					'Dashboard widget that displays paid and unpaid order revenue for the selected period.',
			},
		},
	},
} satisfies Meta< PaymentStatusStoryProps >;

export default meta;

type Story = StoryObj< PaymentStatusStoryControls >;
type DashboardStory = StoryObj< PaymentStatusDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderPaymentStatus,
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
					storyContext: { args: Partial< PaymentStatusStoryControls > }
				) => getPaymentStatusSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing paid and unpaid order revenue for the
 * selected period and previous period.
 */
export const WithComparison: Story = {
	render: renderPaymentStatus,
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
					storyContext: { args: Partial< PaymentStatusStoryControls > }
				) => getPaymentStatusSource( storyContext.args ),
			},
		},
	},
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderPaymentStatusOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'orders/by-date', 'loading' );
		return () => setReportMockState( 'orders/by-date', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderPaymentStatusOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'orders/by-date', 'error' );
		return () => setReportMockState( 'orders/by-date', null );
	},
};

/**
 * Resolved with no order revenue: the widget shows its empty state (the neutral
 * payment glyph and "No order revenue in this period.").
 */
export const Empty: Story = {
	render: () => renderPaymentStatusOnPreset( 'last-365-days' ),
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
	render: args => <PaymentStatusDashboardStory { ...args } />,
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
\trenderModule="storybook/payment-status"
\trenderComponent={ PaymentStatusRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
