import apiFetch from '@wordpress/api-fetch';
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import ConversionRateRender from '../render';
import widgetDefinition from '../widget';
import type { APIFetchMiddleware } from '@wordpress/api-fetch';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

const API_BASE = '/jetpack-premium-analytics/v1/proxy/v2/analytics/reports';
const CONVERSION_RATE_PATH = `${ API_BASE }/sessions/by-conversion-rate`;
const CONVERSION_RATE_RENDER_MODULE = 'storybook/conversion-rate';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

let conversionRateMocksRegistered = false;
let conversionRatePrimaryTo: string | undefined;

function buildConversionRateMockResponse( isComparison: boolean ) {
	const activeSessions = isComparison ? 11840 : 13260;
	const visitors = isComparison ? 9350 : 10480;
	const withCartAddition = isComparison ? 2160 : 2680;
	const reachedCheckout = isComparison ? 940 : 1160;
	const completedCheckout = isComparison ? 455 : 625;

	const summary = {
		active_sessions: String( activeSessions ),
		visitors: String( visitors ),
		with_cart_addition: String( withCartAddition ),
		reached_checkout: String( reachedCheckout ),
		completed_checkout: String( completedCheckout ),
		date_start: '2026-05-01T00:00:00.000Z',
		date_end: '2026-05-31T23:59:59.999Z',
	};

	return {
		summary,
		data: [ summary ],
	};
}

function registerConversionRateMocks(): void {
	if ( conversionRateMocksRegistered ) {
		return;
	}

	conversionRateMocksRegistered = true;

	const conversionRateMiddleware: APIFetchMiddleware = async ( options, next ) => {
		const requestPath = String( options.path ?? options.url ?? '' );

		if ( ! requestPath.startsWith( CONVERSION_RATE_PATH ) ) {
			return next( options );
		}

		const query = new URL( requestPath, 'https://storybook.local' ).searchParams;
		const requestTo = query.get( 'to' ) ?? undefined;
		const isComparison = Boolean(
			conversionRatePrimaryTo && requestTo && requestTo !== conversionRatePrimaryTo
		);

		return buildConversionRateMockResponse( isComparison );
	};

	apiFetch.use( conversionRateMiddleware );
}

registerReportMocks();
registerConversionRateMocks();

type ConversionRateWidgetProps = ComponentProps< typeof ConversionRateRender >;

interface ConversionRateStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type ConversionRateStoryProps = ConversionRateWidgetProps & ConversionRateStoryControls;

interface ConversionRateDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		ConversionRateStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getConversionRateAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): ConversionRateWidgetProps[ 'attributes' ] {
	const reportParams = getDefaultQueryParams( withComparison, preset );
	conversionRatePrimaryTo = reportParams.to;

	return {
		reportParams,
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< ConversionRateStoryControls > ) {
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

function getConversionRateSource( args: Partial< ConversionRateStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<ConversionRateRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderConversionRate( { withComparison, preset }: ConversionRateStoryControls ) {
	return (
		<ConversionRateRender attributes={ getConversionRateAttributes( withComparison, preset ) } />
	);
}

function ConversionRateDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: ConversionRateDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ CONVERSION_RATE_RENDER_MODULE }
			renderComponent={ ConversionRateRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getConversionRateAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/ConversionRate',
	component: ConversionRateRender,
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
					'The "Store conversion rate" widget. Fetches the sessions conversion-rate report and displays the store funnel with optional period-over-period comparison.',
			},
		},
	},
} satisfies Meta< ConversionRateStoryProps >;

export default meta;

type Story = StoryObj< ConversionRateStoryControls >;
type DashboardStory = StoryObj< ConversionRateDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderConversionRate,
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
					storyContext: { args: Partial< ConversionRateStoryControls > }
				) => getConversionRateSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period conversion changes.
 */
export const WithComparison: Story = {
	render: renderConversionRate,
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
					storyContext: { args: Partial< ConversionRateStoryControls > }
				) => getConversionRateSource( storyContext.args ),
			},
		},
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <ConversionRateDashboardStory { ...args } />,
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
\trenderModule="storybook/conversion-rate"
\trenderComponent={ ConversionRateRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
