/**
 * All stories render the data-connected widget through `WidgetRoot`; the shared
 * `wordads/earnings` fixture (registered by `registerReportMocks`) resolves the
 * table. The shared fixture includes adjustment rows, while `Empty` exercises
 * the no-history state.
 * Loading / Error / Empty force the request into each state via
 * `setReportMockState`.
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
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
import WordAdsAdjustmentsHistoryRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const RENDER_MODULE = 'storybook/wordads-adjustments-history';

/**
 * Puts the earnings request into a forced state for a story's lifetime, dropping
 * the cached entry on enter and cleanup so the state actually takes effect (the
 * earnings query key is static — the endpoint takes no params).
 *
 * @param state - The forced mock state.
 * @return A `beforeEach` implementation returning its cleanup.
 */
function forceEarningsState( state: 'loading' | 'error' | 'empty' ) {
	return () => {
		setReportMockState( 'wordads/earnings', state );
		queryClient.removeQueries( { queryKey: [ 'stats', 'wordads-earnings' ] } );
		return () => {
			setReportMockState( 'wordads/earnings', null );
			queryClient.removeQueries( { queryKey: [ 'stats', 'wordads-earnings' ] } );
		};
	};
}

/**
 * Story controls. `withComparison` toggles the comparison report params to
 * confirm the widget renders identically — the earnings endpoint is not
 * period-scoped and has no comparison period.
 */
interface WordAdsAdjustmentsHistoryStoryControls {
	withComparison: boolean;
}

/**
 * Renders the data-connected widget with the given comparison state.
 *
 * @param {WordAdsAdjustmentsHistoryStoryControls} controls - The story controls.
 * @return The rendered widget.
 */
function renderWordAdsAdjustmentsHistory( {
	withComparison,
}: WordAdsAdjustmentsHistoryStoryControls ) {
	return (
		<WordAdsAdjustmentsHistoryRender
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/WordAdsAdjustmentsHistory',
	component: WordAdsAdjustmentsHistoryRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The WordAds "Adjustments History" widget — earnings adjustments by period (amount, payment status), ported from the Jetpack Stats WordAds page.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof WordAdsAdjustmentsHistoryRender > & WordAdsAdjustmentsHistoryStoryControls
>;

export default meta;

type Story = StoryObj< WordAdsAdjustmentsHistoryStoryControls >;

/** Default state — the adjustments history table. */
export const Default: Story = {
	render: renderWordAdsAdjustmentsHistory,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/** First load — the request is in flight. */
export const Loading: Story = {
	render: renderWordAdsAdjustmentsHistory,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceEarningsState( 'loading' ),
};

/** The fetch failed — the error state with a Retry action. */
export const Error: Story = {
	render: renderWordAdsAdjustmentsHistory,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceEarningsState( 'error' ),
};

/** Resolved but empty — no adjustments history for this breakdown. */
export const Empty: Story = {
	render: renderWordAdsAdjustmentsHistory,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceEarningsState( 'empty' ),
};

interface WordAdsAdjustmentsHistoryDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		WordAdsAdjustmentsHistoryStoryControls {}

/**
 * Renders the data-connected widget through the shared dashboard harness, so it
 * appears exactly as it does in product (framed card, sizing, edit mode).
 *
 * @param {WordAdsAdjustmentsHistoryDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real `WidgetDashboard`.
 */
function WordAdsAdjustmentsHistoryDashboardStory( {
	withComparison,
	...dashboardArgs
}: WordAdsAdjustmentsHistoryDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'framed' } }
			renderModule={ RENDER_MODULE }
			renderComponent={
				WordAdsAdjustmentsHistoryRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

/** Mounted inside the real dashboard frame (framed card, sizing, edit mode). */
export const WidgetDashboardWithWidget: StoryObj< WordAdsAdjustmentsHistoryDashboardStoryProps > = {
	render: args => <WordAdsAdjustmentsHistoryDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
