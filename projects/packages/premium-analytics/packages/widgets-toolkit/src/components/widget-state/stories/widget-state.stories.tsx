import { withChartTheme } from '../../../stories/with-chart-theme';
import { BarChart } from '../../chart-bar';
import { WidgetState } from '../widget-state';
import type { BarChartData, BarChartStyle } from '../../chart-bar';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Widget card wrapper, simulating a dashboard widget container so each state is
 * shown within typical widget dimensions.
 */
const WidgetCard = ( { title, children }: { title: string; children: React.ReactNode } ) => (
	<div
		style={ {
			width: '360px',
			height: '320px',
			border: '1px solid var(--wpds-color-stroke-surface-neutral-weak, #e0e0e0)',
			borderRadius: 'var(--wpds-border-radius-md, 8px)',
			background: 'var(--wpds-color-background-surface-neutral, #fff)',
			display: 'flex',
			flexDirection: 'column',
			overflow: 'hidden',
		} }
	>
		<div
			style={ {
				padding: 'var(--wpds-dimension-gap-lg, 16px)',
				borderBottom: '1px solid var(--wpds-color-stroke-surface-neutral-weak, #e0e0e0)',
				fontWeight: 600,
				fontSize: 'var(--wpds-typography-font-size-sm, 14px)',
				color: 'var(--wpds-color-foreground-content-neutral, #1e1e1e)',
			} }
		>
			{ title }
		</div>
		<div style={ { position: 'relative', flex: 1, minHeight: 0 } }>{ children }</div>
	</div>
);

const withWidgetCard = ( Story: React.ComponentType ) => (
	<WidgetCard title="Traffic by source">
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
			padding: 'var(--wpds-dimension-gap-lg, 16px)',
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
