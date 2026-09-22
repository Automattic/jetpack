import { MONTHS_IN_YEAR, monthOrder, type MonthKey } from '../../../helpers/month-key';
import {
	monthlyHeatmapLabels,
	type MonthlyHeatmapMetric,
} from '../../../helpers/monthly-heatmap-metric';
import { WidgetCard } from '../../../stories/widget-card';
import { withChartTheme } from '../../../stories/with-chart-theme';
import { MonthlyHeatmap } from '../monthly-heatmap';
import type { MonthlyHeatmapProps, MonthlyHeatmapRow } from '../monthly-heatmap';
import type { Meta, StoryObj } from '@storybook/react';

// Fixed months: a story that moved with the clock would render differently on
// every visual diff. The span opens in March so the oldest row starts with filler.
const LAST_MONTH: MonthKey = { year: 2026, month: 7 };
const FIRST_MONTH_OF_SPAN = 2;

function daysInMonth( { year, month }: MonthKey ) {
	return new Date( Date.UTC( year, month + 1, 0 ) ).getUTCDate();
}

/**
 * A deterministic seasonal series with a slow climb, so the scale has a spread
 * and the newest rows read darker than the oldest.
 */
function viewsInMonth( key: MonthKey, index: number, metric: MonthlyHeatmapMetric ) {
	// A few scattered months with no traffic at all, so measured zeros are covered.
	if ( index % 17 === 5 ) {
		return 0;
	}

	const views = Math.round( 2400 + 1800 * Math.sin( ( index - 3 ) / 1.9 ) + index * 90 );

	return metric === 'average' ? Math.round( views / daysInMonth( key ) ) : views;
}

function buildRows( years: number, metric: MonthlyHeatmapMetric ): MonthlyHeatmapRow[] {
	const firstOrder = monthOrder( {
		year: LAST_MONTH.year - years + 1,
		month: FIRST_MONTH_OF_SPAN,
	} );
	const lastOrder = monthOrder( LAST_MONTH );

	return Array.from( { length: years }, ( _row, rowIndex ) => {
		const year = LAST_MONTH.year - rowIndex;
		const months = Array.from( { length: MONTHS_IN_YEAR }, ( _month, month ) => {
			const order = monthOrder( { year, month } );

			return order < firstOrder || order > lastOrder
				? null
				: viewsInMonth( { year, month }, order - firstOrder, metric );
		} );
		const measured = months.filter( ( value ): value is number => value !== null );
		const sum = measured.reduce( ( acc, value ) => acc + value, 0 );

		return {
			year,
			months,
			total: metric === 'average' ? Math.round( sum / measured.length ) : sum,
		};
	} );
}

interface MonthlyHeatmapStoryControls {
	/** Which number each cell reports, and so which labels the table carries. */
	metric: MonthlyHeatmapMetric;
	/** How many years of history to draw, newest first. */
	years: number;
	/** Width of the mock tile, in px. */
	tileWidth: number;
	/** Height of the mock tile, in px. Drives whether the grid scrolls. */
	tileHeight: number;
	/** Pass `onSelect`, so the cells take a pointer cursor and picking one logs an action. */
	selectable: boolean;
}

type MonthlyHeatmapStoryArgs = MonthlyHeatmapStoryControls &
	Pick< MonthlyHeatmapProps, 'onSelect' >;

function renderMonthlyHeatmap( {
	metric,
	years,
	tileWidth,
	tileHeight,
	selectable,
	onSelect,
}: MonthlyHeatmapStoryArgs ) {
	return (
		<WidgetCard width={ `${ tileWidth }px` } height={ `${ tileHeight }px` }>
			<MonthlyHeatmap
				rows={ buildRows( years, metric ) }
				{ ...monthlyHeatmapLabels( metric ) }
				onSelect={ selectable ? onSelect : undefined }
			/>
		</WidgetCard>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/MonthlyHeatmap',
	component: MonthlyHeatmap,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'A year × month heatmap with a per-year roll-up column, filling the tile it is given. Rows are drawn newest first whatever order they arrive in; a `null` month is filler, drawn faded and skipped by hover and the keyboard. The grid alone scrolls when the rows outgrow the tile, keeping the month labels, the year column and the scale in view, and its cells stop growing at the design height so a short history does not stretch. `onSelect` reports the picked month, or the year alone for its roll-up; without it the cells are inert. Drag `years` and `tileHeight` to watch the grid re-fit.',
			},
		},
	},
	argTypes: {
		metric: {
			control: 'radio',
			options: [ 'total', 'average' ],
			description: "The month's views, or its views per day; picks the tooltip and scale labels.",
		},
		years: { control: { type: 'range', min: 1, max: 20, step: 1 } },
		tileWidth: { control: { type: 'range', min: 360, max: 1600, step: 20 } },
		tileHeight: { control: { type: 'range', min: 140, max: 900, step: 8 } },
		selectable: { control: 'boolean' },
		// Logged to the Actions panel; `selectable` decides whether it is passed at all.
		onSelect: { action: 'select', control: false },
	},
	decorators: [ withChartTheme ],
	// `component` is the component's own props, but the args are story controls:
	// intersect the two so both type-check.
} satisfies Meta< MonthlyHeatmapProps & MonthlyHeatmapStoryControls >;

export default meta;

type Story = StoryObj< MonthlyHeatmapStoryArgs >;

const DEFAULT_ARGS: MonthlyHeatmapStoryArgs = {
	metric: 'total',
	years: 4,
	tileWidth: 900,
	tileHeight: 320,
	selectable: true,
};

/**
 * Four years of monthly views, newest first. The oldest row opens with filler
 * months and the newest closes with them after August, so neither is hoverable
 * or reachable by keyboard. Picking a cell logs the target in the Actions panel.
 */
export const Default: Story = {
	render: renderMonthlyHeatmap,
	args: DEFAULT_ARGS,
};

/**
 * The same span as views per day. The cells carry smaller numbers, and the
 * tooltip and scale say "per day".
 */
export const DailyAverage: Story = {
	render: renderMonthlyHeatmap,
	args: { ...DEFAULT_ARGS, metric: 'average' },
};

/**
 * More rows than the tile can hold at the minimum cell height. The grid scrolls
 * on its own while the month labels, the year column and the scale stay put.
 */
export const ManyYears: Story = {
	render: renderMonthlyHeatmap,
	args: { ...DEFAULT_ARGS, years: 12 },
};

/**
 * A single row. The cells stop at the design height rather than stretching to
 * fill the tile.
 */
export const SingleYear: Story = {
	render: renderMonthlyHeatmap,
	args: { ...DEFAULT_ARGS, years: 1 },
};

/**
 * Without `onSelect`: the cells keep their tooltips but take no pointer cursor,
 * and clicking or pressing Enter on one does nothing.
 */
export const ReadOnly: Story = {
	render: renderMonthlyHeatmap,
	args: { ...DEFAULT_ARGS, selectable: false },
};
