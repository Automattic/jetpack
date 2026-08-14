import { search } from '@wordpress/icons';
import { withChartTheme } from '../../../stories/with-chart-theme';
import { BarChart } from '../../chart-bar';
import { WidgetState } from '../widget-state';
import type { BarChartData, BarChartStyle } from '../../chart-bar';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Widget card wrapper, simulating a dashboard widget container so each state is
 * shown within typical widget dimensions.
 */
const WidgetCard = ( {
	title,
	height = '320px',
	children,
}: {
	title: string;
	height?: string;
	children: React.ReactNode;
} ) => (
	<div
		style={ {
			width: '360px',
			height,
			border: '1px solid var(--wpds-color-stroke-surface-neutral-weak)',
			borderRadius: 'var(--wpds-border-radius-md)',
			background: 'var(--wpds-color-background-surface-neutral)',
			display: 'flex',
			flexDirection: 'column',
			overflow: 'hidden',
		} }
	>
		<div
			style={ {
				padding: 'var(--wpds-dimension-gap-lg)',
				borderBottom: '1px solid var(--wpds-color-stroke-surface-neutral-weak)',
				fontWeight: 600,
				fontSize: 'var(--wpds-typography-font-size-sm)',
				color: 'var(--wpds-color-foreground-content-neutral)',
			} }
		>
			{ title }
		</div>
		<div style={ { position: 'relative', flex: 1, minHeight: 0 } }>{ children }</div>
	</div>
);

// `widgetCardHeight` story parameter sizes the mock card, so height-dependent
// behavior (the 140px short-tile breakpoint) can be shown per story.
const withWidgetCard = (
	Story: React.ComponentType,
	context: { parameters: { widgetCardHeight?: string } }
) => (
	<WidgetCard title="Traffic by source" height={ context.parameters.widgetCardHeight }>
		<Story />
	</WidgetCard>
);

const meta: Meta< typeof WidgetState > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/WidgetState',
	component: WidgetState,
	tags: [ 'autodocs' ],
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component:
					'Data-agnostic widget content-area state. Derives one state (error → loading → empty → ready, plus a busy overlay on background refetch) from four boolean signals and renders it. Callers map their fetch result to the signals and pass generic `error` / `empty` descriptors. Stories render it inside a mock widget card; the ready and busy states show a mock bar chart standing in for real widget content.',
			},
		},
	},
	// Every story renders inside the mock widget card; `withChartTheme` supplies
	// the charts context so the mock `BarChart` renders, mirroring what
	// `WidgetRoot` provides at the top of the widget tree in the app.
	decorators: [ withWidgetCard, withChartTheme ],
};

export default meta;

type Story = StoryObj< typeof WidgetState >;

const CHART_STYLES: BarChartStyle[] = [ { stroke: '#3858E9' } ];

const CHART_DATA: BarChartData = [
	{
		label: 'Dec 16, 2025-Jan 14, 2026',
		data: [
			{ label: 'Direct', value: 4200 },
			{ label: 'Search', value: 3100 },
			{ label: 'Social', value: 2600 },
			{ label: 'Email', value: 2050 },
		],
	},
];

/**
 * Mock widget content: a bar chart standing in for a real widget body. The
 * responsive `BarChart` fills its parent, so the wrapper needs an explicit
 * height for the chart to render.
 */
const MockChart = () => (
	<div
		style={ {
			width: '100%',
			height: '100%',
			boxSizing: 'border-box',
			padding: 'var(--wpds-dimension-gap-lg)',
		} }
	>
		<BarChart chartData={ CHART_DATA } dataFormat={ { type: 'number' } } styles={ CHART_STYLES } />
	</div>
);

/**
 * First load: a fetch is in flight and there is no data yet, so the loading
 * overlay is shown instead of the children.
 */
export const Loading: Story = {
	args: {
		isLoading: true,
		isError: false,
		isEmpty: true,
		children: <MockChart />,
	},
};

/**
 * The fetch failed. Shows the error message and a Retry action.
 */
export const Error: Story = {
	args: {
		isLoading: false,
		isError: true,
		isEmpty: false,
		error: {
			description: "We couldn't load this data. Please try again in a moment.",
			// eslint-disable-next-line no-console
			actions: [ { label: 'Retry', onClick: () => console.log( 'Retry clicked' ) } ],
		},
		children: <MockChart />,
	},
};

/**
 * Resolved with no rows. Renders no icon by default — a widget opts in via
 * `empty.icon` with its own neutral glyph, distinct from the error state.
 */
export const Empty: Story = {
	args: {
		isLoading: false,
		isError: false,
		isEmpty: true,
		empty: { description: 'No traffic recorded for this period.' },
		children: <MockChart />,
	},
};

/**
 * Empty state with an opt-in icon at a regular tile height (above the 140px
 * short-tile breakpoint): the glyph renders above the text.
 */
export const EmptyWithIcon: Story = {
	args: {
		isLoading: false,
		isError: false,
		isEmpty: true,
		empty: { icon: search, description: 'No traffic recorded for this period.' },
		children: <MockChart />,
	},
};

/**
 * Error on a short tile (below the 140px body breakpoint): the container query
 * hides the glyph so the text-only state stays vertically centered inside the
 * body and never overlaps the widget footer.
 */
export const ErrorShortTile: Story = {
	parameters: { widgetCardHeight: '180px' },
	args: {
		isLoading: false,
		isError: true,
		isEmpty: false,
		error: {
			description: "We couldn't load this data. Please try again in a moment.",
			// eslint-disable-next-line no-console
			actions: [ { label: 'Retry', onClick: () => console.log( 'Retry clicked' ) } ],
		},
		children: <MockChart />,
	},
};

/**
 * Empty (with an opt-in icon) on a short tile: same degradation as the error
 * state — the glyph hides and the text stays vertically centered.
 */
export const EmptyShortTileWithIcon: Story = {
	parameters: { widgetCardHeight: '180px' },
	args: {
		isLoading: false,
		isError: false,
		isEmpty: true,
		empty: { icon: search, description: 'No traffic recorded for this period.' },
		children: <MockChart />,
	},
};

/**
 * Success: the children (a mock bar chart) render as-is.
 */
export const Ready: Story = {
	args: {
		isLoading: false,
		isError: false,
		isEmpty: false,
		children: <MockChart />,
	},
};

/**
 * Background refetch: the chart stays visible under a non-blocking busy overlay
 * while fresh data loads.
 */
export const Busy: Story = {
	args: {
		isLoading: false,
		isFetching: true,
		isError: false,
		isEmpty: false,
		children: <MockChart />,
	},
};
