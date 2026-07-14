import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import SalesByUtmCampaignRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SALES_BY_UTM_CAMPAIGN_RENDER_MODULE = 'storybook/sales-by-utm-campaign';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type SalesByUtmCampaignWidgetProps = ComponentProps< typeof SalesByUtmCampaignRender >;

interface SalesByUtmCampaignStoryControls {
	/**
	 * Whether to include comparison report params.
	 */
	withComparison: boolean;
	/**
	 * Date-range preset used to generate report params.
	 */
	preset: SelectablePresetId;
}

type SalesByUtmCampaignStoryProps = SalesByUtmCampaignWidgetProps & SalesByUtmCampaignStoryControls;

interface SalesByUtmCampaignDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		SalesByUtmCampaignStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getSalesByUtmCampaignAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): SalesByUtmCampaignWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< SalesByUtmCampaignStoryControls > ) {
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

function getSalesByUtmCampaignSource( args: Partial< SalesByUtmCampaignStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<SalesByUtmCampaignRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderSalesByUtmCampaign( { withComparison, preset }: SalesByUtmCampaignStoryControls ) {
	return (
		<SalesByUtmCampaignRender
			attributes={ getSalesByUtmCampaignAttributes( withComparison, preset ) }
		/>
	);
}

/**
 * Story wrapper for rendering the sales by UTM campaign widget in dashboard chrome.
 *
 * @param {SalesByUtmCampaignDashboardStoryProps} props - Story controls.
 * @return The rendered Storybook story.
 */
function SalesByUtmCampaignDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: SalesByUtmCampaignDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ SALES_BY_UTM_CAMPAIGN_RENDER_MODULE }
			renderComponent={ SalesByUtmCampaignRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getSalesByUtmCampaignAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/SalesByUtmCampaign',
	component: SalesByUtmCampaignRender,
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
					'Dashboard widget that displays top UTM campaigns by order revenue for the selected period.',
			},
		},
	},
} satisfies Meta< SalesByUtmCampaignStoryProps >;

export default meta;

type Story = StoryObj< SalesByUtmCampaignStoryControls >;
type DashboardStory = StoryObj< SalesByUtmCampaignDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderSalesByUtmCampaign,
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
					storyContext: { args: Partial< SalesByUtmCampaignStoryControls > }
				) => getSalesByUtmCampaignSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period change and sparkline data.
 */
export const WithComparison: Story = {
	render: renderSalesByUtmCampaign,
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
					storyContext: { args: Partial< SalesByUtmCampaignStoryControls > }
				) => getSalesByUtmCampaignSource( storyContext.args ),
			},
		},
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <SalesByUtmCampaignDashboardStory { ...args } />,
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
\trenderModule="storybook/sales-by-utm-campaign"
\trenderComponent={ SalesByUtmCampaignRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
