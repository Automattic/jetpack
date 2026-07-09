import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import NewVsReturningCustomerRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const NEW_VS_RETURNING_CUSTOMER_RENDER_MODULE = 'storybook/new-vs-returning-customer';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type NewVsReturningCustomerWidgetProps = ComponentProps< typeof NewVsReturningCustomerRender >;

interface NewVsReturningCustomerStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type NewVsReturningCustomerStoryProps = NewVsReturningCustomerWidgetProps &
	NewVsReturningCustomerStoryControls;

interface NewVsReturningCustomerDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		NewVsReturningCustomerStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getNewVsReturningCustomerAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): NewVsReturningCustomerWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< NewVsReturningCustomerStoryControls > ) {
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

function getNewVsReturningCustomerSource( args: Partial< NewVsReturningCustomerStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<NewVsReturningCustomerRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderNewVsReturningCustomer( {
	withComparison,
	preset,
}: NewVsReturningCustomerStoryControls ) {
	return (
		<NewVsReturningCustomerRender
			attributes={ getNewVsReturningCustomerAttributes( withComparison, preset ) }
		/>
	);
}

function NewVsReturningCustomerDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: NewVsReturningCustomerDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ NEW_VS_RETURNING_CUSTOMER_RENDER_MODULE }
			renderComponent={
				NewVsReturningCustomerRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ getNewVsReturningCustomerAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/NewVsReturningCustomer',
	component: NewVsReturningCustomerRender,
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
					'Dashboard widget that displays new and returning customer counts for the selected period.',
			},
		},
	},
} satisfies Meta< NewVsReturningCustomerStoryProps >;

export default meta;

type Story = StoryObj< NewVsReturningCustomerStoryControls >;
type DashboardStory = StoryObj< NewVsReturningCustomerDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderNewVsReturningCustomer,
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
					storyContext: { args: Partial< NewVsReturningCustomerStoryControls > }
				) => getNewVsReturningCustomerSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period customer deltas.
 */
export const WithComparison: Story = {
	render: renderNewVsReturningCustomer,
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
					storyContext: { args: Partial< NewVsReturningCustomerStoryControls > }
				) => getNewVsReturningCustomerSource( storyContext.args ),
			},
		},
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <NewVsReturningCustomerDashboardStory { ...args } />,
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
\trenderModule="storybook/new-vs-returning-customer"
\trenderComponent={ NewVsReturningCustomerRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
