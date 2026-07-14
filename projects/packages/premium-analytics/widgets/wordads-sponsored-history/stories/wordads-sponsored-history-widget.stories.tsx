/**
 * All stories render the data-connected widget through `WidgetRoot`; the shared
 * `wordads/earnings` fixture (registered by `registerReportMocks`) resolves the
 * table. The fixture's `sponsored` breakdown is empty, so `Default` renders the
 * empty state; `Populated` overrides the response to show a populated table.
 * The earnings endpoint is not period-scoped, so `WithComparison` renders
 * identically to `Default` even though comparison report params are supplied.
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
	setReportMockResponse,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import WordAdsSponsoredHistoryRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const RENDER_MODULE = 'storybook/wordads-sponsored-history';

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
 * Overrides the earnings response with populated `sponsored` rows for the
 * lifetime of a story — the shared fixture leaves `sponsored` empty so
 * `Default` can exercise the empty state, but reviewers still need to see the
 * populated table.
 *
 * @return A `beforeEach` implementation returning its cleanup.
 */
function forcePopulatedSponsored() {
	return () => {
		setReportMockResponse( 'wordads/earnings', {
			earnings: {
				total_earnings: '44.14',
				total_amount_owed: '44.14',
				wordads: {},
				sponsored: {
					'2026-07': { amount: '44.14', pageviews: 14332, status: 0 },
					'2026-06': { amount: '28.23', pageviews: 8580, status: 1 },
				},
				adjustment: {},
			},
		} );
		queryClient.removeQueries( { queryKey: [ 'stats', 'wordads-earnings' ] } );
		return () => {
			setReportMockResponse( 'wordads/earnings', null );
			queryClient.removeQueries( { queryKey: [ 'stats', 'wordads-earnings' ] } );
		};
	};
}

/**
 * Story controls. `withComparison` toggles the comparison report params to
 * confirm the widget renders identically — the earnings endpoint is not
 * period-scoped and has no comparison period.
 */
interface WordAdsSponsoredHistoryStoryControls {
	withComparison: boolean;
}

/**
 * Renders the data-connected widget with the given comparison state.
 *
 * @param {WordAdsSponsoredHistoryStoryControls} controls - The story controls.
 * @return The rendered widget.
 */
function renderWordAdsSponsoredHistory( { withComparison }: WordAdsSponsoredHistoryStoryControls ) {
	return (
		<WordAdsSponsoredHistoryRender
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Close-up canvas so the table fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '420px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/WordAdsSponsoredHistory',
	component: WordAdsSponsoredHistoryRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The WordAds "Sponsored Content History" widget — sponsored-content earnings by period (amount, ads served, payment status), ported from the Jetpack Stats WordAds page.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof WordAdsSponsoredHistoryRender > & WordAdsSponsoredHistoryStoryControls
>;

export default meta;

type Story = StoryObj< WordAdsSponsoredHistoryStoryControls >;

/** Default state — the shared fixture's `sponsored` breakdown is empty. */
export const Default: Story = {
	render: renderWordAdsSponsoredHistory,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison state — comparison report params are supplied, but the earnings
 * endpoint is not period-scoped and has no comparison period, so this renders
 * identically to Default.
 */
export const WithComparison: Story = {
	render: renderWordAdsSponsoredHistory,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			description: {
				story:
					'The earnings endpoint has no comparison period, so this renders identically to Default even when comparison report params are supplied.',
			},
		},
	},
};

/** First load — the request is in flight. */
export const Loading: Story = {
	render: renderWordAdsSponsoredHistory,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceEarningsState( 'loading' ),
};

/** The fetch failed — the error state with a Retry action. */
export const Error: Story = {
	render: renderWordAdsSponsoredHistory,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceEarningsState( 'error' ),
};

/** Resolved but empty — no sponsored-content history for this breakdown. */
export const Empty: Story = {
	render: renderWordAdsSponsoredHistory,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceEarningsState( 'empty' ),
};

/**
 * The shared fixture leaves `sponsored` empty so `Default` can exercise the
 * empty state; this story overrides the response with populated rows so
 * reviewers can see the table.
 */
export const Populated: Story = {
	render: renderWordAdsSponsoredHistory,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forcePopulatedSponsored(),
};

interface WordAdsSponsoredHistoryDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		WordAdsSponsoredHistoryStoryControls {}

/**
 * Renders the data-connected widget through the shared dashboard harness, so it
 * appears exactly as it does in product (framed card, sizing, edit mode).
 *
 * @param {WordAdsSponsoredHistoryDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real `WidgetDashboard`.
 */
function WordAdsSponsoredHistoryDashboardStory( {
	withComparison,
	...dashboardArgs
}: WordAdsSponsoredHistoryDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'framed' } }
			renderModule={ RENDER_MODULE }
			renderComponent={
				WordAdsSponsoredHistoryRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

/** Mounted inside the real dashboard frame (framed card, sizing, edit mode). */
export const WidgetDashboardWithWidget: StoryObj< WordAdsSponsoredHistoryDashboardStoryProps > = {
	render: args => <WordAdsSponsoredHistoryDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
