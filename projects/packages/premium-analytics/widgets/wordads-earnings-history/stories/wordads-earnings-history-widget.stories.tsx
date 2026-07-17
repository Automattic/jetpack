/**
 * All stories render the data-connected widget through `WidgetRoot`; the shared
 * `wordads/earnings` fixture (registered by `registerReportMocks`) resolves the
 * table. Loading / Error / Empty force the request into each state via
 * `forceWordAdsEarningsState`.
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
import WordAdsEarningsHistoryRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const RENDER_MODULE = 'storybook/wordads-earnings-history';

/**
 * Story controls. `withComparison` toggles the comparison report params to
 * confirm the widget renders identically — the earnings endpoint is not
 * period-scoped and has no comparison period.
 */
interface WordAdsEarningsHistoryStoryControls {
	withComparison: boolean;
}

/**
 * Renders the data-connected widget with the given comparison state.
 *
 * @param {WordAdsEarningsHistoryStoryControls} controls - The story controls.
 * @return The rendered widget.
 */
function renderWordAdsEarningsHistory( { withComparison }: WordAdsEarningsHistoryStoryControls ) {
	return (
		<WordAdsEarningsHistoryRender
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/WordAdsEarningsHistory',
	component: WordAdsEarningsHistoryRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The WordAds "Earnings History" widget — WordAds earnings by period (amount, ads served, payment status), ported from the Jetpack Stats WordAds page.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof WordAdsEarningsHistoryRender > & WordAdsEarningsHistoryStoryControls
>;

export default meta;

type Story = StoryObj< WordAdsEarningsHistoryStoryControls >;

/** Default state — the earnings history table. */
export const Default: Story = {
	render: renderWordAdsEarningsHistory,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/** First load — the request is in flight. */
export const Loading: Story = {
	render: renderWordAdsEarningsHistory,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWordAdsEarningsState( 'loading' ),
};

/** The fetch failed — the error state with a Retry action. */
export const Error: Story = {
	render: renderWordAdsEarningsHistory,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWordAdsEarningsState( 'error' ),
};

/** Resolved but empty — no earnings history for this breakdown. */
export const Empty: Story = {
	render: renderWordAdsEarningsHistory,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWordAdsEarningsState( 'empty' ),
};

interface WordAdsEarningsHistoryDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		WordAdsEarningsHistoryStoryControls {}

/**
 * Renders the data-connected widget through the shared dashboard harness, so it
 * appears exactly as it does in product (framed card, sizing, edit mode).
 *
 * @param {WordAdsEarningsHistoryDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real `WidgetDashboard`.
 */
function WordAdsEarningsHistoryDashboardStory( {
	withComparison,
	...dashboardArgs
}: WordAdsEarningsHistoryDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'content-bleed' } }
			renderModule={ RENDER_MODULE }
			renderComponent={
				WordAdsEarningsHistoryRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

/** Mounted inside the real dashboard frame (framed card, sizing, edit mode). */
export const WidgetDashboardWithWidget: StoryObj< WordAdsEarningsHistoryDashboardStoryProps > = {
	render: args => <WordAdsEarningsHistoryDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
