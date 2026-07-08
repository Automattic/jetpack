/**
 * The stories drive the data-connected WordAds earnings widget through the
 * shared report-mock harness, which serves the WordAds earnings endpoint
 * (`/proxy/v1.1/wordads/earnings`) from `register-report-mocks`.
 *
 * This module has no comparison period, so `Default` and `WithComparison`
 * render identically; the toggle only exercises the date-range picker's
 * comparison params flowing through `reportParams` without breaking the widget.
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import WordAdsEarningsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const WORDADS_EARNINGS_RENDER_MODULE = 'storybook/wordads-earnings';

interface WordAdsEarningsStoryControls {
	/**
	 * Whether to include comparison report params.
	 */
	withComparison: boolean;
}

/**
 * Renders the data-connected widget with report params derived from the
 * date-range picker preset.
 *
 * @param {WordAdsEarningsStoryControls} props - The story controls.
 * @return The rendered widget.
 */
function renderWordAdsEarnings( { withComparison }: WordAdsEarningsStoryControls ) {
	return (
		<WordAdsEarningsRender
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Close-up canvas so the earnings breakdown fills the frame outside the
// dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', maxWidth: '480px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/WordAdsEarnings',
	component: WordAdsEarningsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "WordAds earnings" widget. Shows ad-revenue headline totals (total earnings and amount owed) plus a per-period breakdown for each earnings source — WordAds, sponsored content, and adjustments — sourced from the Jetpack Stats WordAds earnings endpoint. This module has no comparison period, so values render without deltas and the `WithComparison` story looks identical to `Default`.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof WordAdsEarningsRender > & WordAdsEarningsStoryControls >;

export default meta;

type Story = StoryObj< WordAdsEarningsStoryControls >;

/**
 * Default state — cumulative totals and the per-period earnings breakdown.
 */
export const Default: Story = {
	render: renderWordAdsEarnings,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison params flow through `reportParams`, but the WordAds earnings
 * endpoint has no comparison data, so the widget renders identically to
 * `Default` — no fake deltas.
 */
export const WithComparison: Story = {
	render: renderWordAdsEarnings,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

interface WordAdsEarningsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		WordAdsEarningsStoryControls {}

/**
 * Renders the data-connected widget through the shared dashboard harness, so it
 * appears exactly as it does in product (framed card, sizing, edit mode).
 *
 * @param {WordAdsEarningsDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real `WidgetDashboard`.
 */
function WordAdsEarningsDashboardStory( {
	withComparison,
	...dashboardArgs
}: WordAdsEarningsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ {
				name: widgetDefinition.name,
				title: widgetDefinition.title,
				icon: widgetDefinition.icon,
				presentation: 'framed',
			} }
			renderModule={ WORDADS_EARNINGS_RENDER_MODULE }
			renderComponent={ WordAdsEarningsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< WordAdsEarningsDashboardStoryProps > = {
	render: args => <WordAdsEarningsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
