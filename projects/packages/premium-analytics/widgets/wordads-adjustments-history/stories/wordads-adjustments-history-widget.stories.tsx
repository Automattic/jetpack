/**
 * All stories render the data-connected widget through `WidgetRoot`; the shared
 * `wordads/earnings` fixture (registered by `registerReportMocks`) resolves the
 * table. The shared fixture includes adjustment rows, while `Empty` exercises
 * the no-history state.
 * Loading / Error / Empty force the request into each state via
 * `forceWordAdsEarningsState`.
 *
 * The earnings module is not period-scoped and the table has no comparison
 * surface, so no `withComparison` control is exposed; the default report params
 * only satisfy the WidgetRoot boundary.
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	forceWordAdsEarningsState,
	registerReportMocks,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import WordAdsAdjustmentsHistoryRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();

const RENDER_MODULE = 'storybook/wordads-adjustments-history';

const meta = {
	title: 'Packages/Premium Analytics/Widgets/WordAdsAdjustmentsHistory',
	component: WordAdsAdjustmentsHistoryRender,
	// The earnings endpoint ignores report params, but WidgetRoot still expects
	// them; the default (non-comparison) params satisfy that boundary.
	args: { attributes: { reportParams: getDefaultQueryParams() } },
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The WordAds "Adjustments History" widget — earnings adjustments by period (amount, payment status), ported from the Jetpack Stats WordAds page.',
			},
		},
	},
} satisfies Meta< typeof WordAdsAdjustmentsHistoryRender >;

export default meta;

type Story = StoryObj< typeof meta >;

/** Default state — the adjustments history table. */
export const Default: Story = {
	decorators: [ withWidgetCanvas ],
};

/** First load — the request is in flight. */
export const Loading: Story = {
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWordAdsEarningsState( 'loading' ),
};

/** The fetch failed — the error state with a Retry action. */
export const Error: Story = {
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWordAdsEarningsState( 'error' ),
};

/** Resolved but empty — no adjustments history for this breakdown. */
export const Empty: Story = {
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWordAdsEarningsState( 'empty' ),
};

/**
 * Renders the data-connected widget through the shared dashboard harness, so it
 * appears exactly as it does in product (framed card, sizing, edit mode).
 *
 * @param {WidgetDashboardWithWidgetControls} dashboardArgs - The dashboard story controls.
 * @return The widget mounted inside the real `WidgetDashboard`.
 */
function WordAdsAdjustmentsHistoryDashboardStory(
	dashboardArgs: WidgetDashboardWithWidgetControls
) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'content-bleed' } }
			renderModule={ RENDER_MODULE }
			renderComponent={
				WordAdsAdjustmentsHistoryRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ { reportParams: getDefaultQueryParams() } }
		/>
	);
}

/** Mounted inside the real dashboard frame (framed card, sizing, edit mode). */
export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <WordAdsAdjustmentsHistoryDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
