import { HeatmapChartUnresponsive } from '@jetpack-premium-analytics/externals';
import { buildDenseDaySeries } from '../../../helpers/calendar-heatmap-window';
import { withChartTheme } from '../../../stories/with-chart-theme';
import { AdaptiveCalendarHeatmap } from '../adaptive-calendar-heatmap';
import type { AdaptiveCalendarHeatmapProps } from '../adaptive-calendar-heatmap';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';

// Fixed dates: a story that moved with the clock would render differently on every
// visual diff.
const PERIOD = { startDate: '2025-01-01', endDate: '2026-08-10' };
const SHORT_PERIOD = { startDate: '2026-06-01', endDate: '2026-06-30' };

/**
 * A deterministic weekday-weighted series. Real traffic dips at weekends, and a
 * flat ramp would hide the color scale.
 */
function buildViewsByDay( period: { startDate: string; endDate: string } ) {
	return Object.fromEntries(
		buildDenseDaySeries( {}, period.startDate, period.endDate ).map( ( { dateString }, index ) => {
			const weekday = new Date( `${ dateString }T00:00:00Z` ).getUTCDay();
			const isWeekend = weekday === 0 || weekday === 6;

			// A few scattered days with no traffic at all, so blank cells are covered.
			if ( index % 37 === 0 ) {
				return [ dateString, null ];
			}

			return [
				dateString,
				Math.round( ( isWeekend ? 400 : 1800 ) * ( 1 + Math.sin( index / 45 ) ) + 120 ),
			];
		} )
	);
}

const VIEWS_BY_DAY = buildViewsByDay( PERIOD );
const SHORT_PERIOD_VIEWS_BY_DAY = buildViewsByDay( SHORT_PERIOD );

interface AdaptiveCalendarHeatmapStoryControls {
	/** Width of the mock tile's body, in px. Drives how many columns are drawn. */
	tileWidth: number;
	/** Height of the mock tile's body, in px. Drives the cell size. */
	tileHeight: number;
	/** Use a one-month period to show how a grid shorter than the tile is filled. */
	shortPeriod: boolean;
}

// The current year is selected as January through today, so early in the year it is
// the shortest period Insights can produce.
const CURRENT_YEAR_AS_OF = [
	{ label: 'Jan 15 — 2 weeks of data', endDate: '2026-01-15' },
	{ label: 'Apr 15 — 15 weeks of data', endDate: '2026-04-15' },
	{ label: 'Aug 19 — 33 weeks of data', endDate: '2026-08-19' },
	{ label: 'Dec 31 — the whole year', endDate: '2026-12-31' },
] as const;

/**
 * Mock widget tile. The component measures its parent, so `width` / `height` must be
 * the widget *body* box, not the tile — keep `ShortTile` on the real ~86px body
 * height, since a roomier value hides overflow the real tile would show.
 */
function TileCanvas( {
	width,
	height,
	children,
}: {
	width: number;
	height: number;
	children: ReactNode;
} ) {
	return (
		<div
			style={ {
				padding: '16px',
				width: 'fit-content',
				border: '1px solid var(--wpds-color-stroke-surface-neutral-weak)',
				borderRadius: 'var(--wpds-border-radius-md)',
				background: 'var(--wpds-color-background-surface-neutral)',
			} }
		>
			<div style={ { width: `${ width }px`, height: `${ height }px` } }>{ children }</div>
		</div>
	);
}

function renderAdaptiveCalendarHeatmap( {
	tileWidth,
	tileHeight,
	shortPeriod,
}: AdaptiveCalendarHeatmapStoryControls ) {
	return (
		<TileCanvas width={ tileWidth } height={ tileHeight }>
			<AdaptiveCalendarHeatmap
				valueByDay={ shortPeriod ? SHORT_PERIOD_VIEWS_BY_DAY : VIEWS_BY_DAY }
				period={ shortPeriod ? SHORT_PERIOD : PERIOD }
			>
				{ chartProps => (
					<HeatmapChartUnresponsive
						{ ...chartProps }
						primaryColor="var(--wp-admin-theme-color, #3858e9)"
						withTooltips
					/>
				) }
			</AdaptiveCalendarHeatmap>
		</TileCanvas>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/AdaptiveCalendarHeatmap',
	component: AdaptiveCalendarHeatmap,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					"Fits a calendar heatmap to the tile it is given, so both calendar heatmap widgets size consistently. The tile's height picks the cell size — 61:40 cells that shrink or grow to fill the height, showing their values once they are wide enough for a number — and its width picks how many week columns are drawn. The grid is sized to the exact rectangle its covered period occupies, without overflowing or rendering unfetched dates as empty cells. It renders the measured wrapper and hands the caller the chart props to spread, so each widget keeps its own data, states, and tooltip. Drag `tileWidth` / `tileHeight` in any story to watch the grid re-fit.",
			},
		},
	},
	argTypes: {
		tileWidth: { control: { type: 'range', min: 240, max: 1600, step: 20 } },
		tileHeight: { control: { type: 'range', min: 80, max: 900, step: 8 } },
		shortPeriod: { control: 'boolean' },
	},
	// `component` is the component's own props, but the args are story controls:
	// intersect the two so both type-check.
} satisfies Meta< AdaptiveCalendarHeatmapProps & AdaptiveCalendarHeatmapStoryControls >;

export default meta;

type Story = StoryObj< AdaptiveCalendarHeatmapStoryControls >;

const SHORT_TILE_ARGS: AdaptiveCalendarHeatmapStoryControls = {
	tileWidth: 1200,
	tileHeight: 86,
	shortPeriod: false,
};

/**
 * A one-row dashboard tile, the size both calendar heatmaps ship at. The cells
 * shrink to fit it — too small for numbers, so the width buys years of history —
 * and the month labels and all seven weekday rows stay inside the tile.
 */
export const ShortTile: Story = {
	render: renderAdaptiveCalendarHeatmap,
	args: SHORT_TILE_ARGS,
	decorators: [ withChartTheme ],
};

/**
 * A two-row tile. The cells grow to fill the height, showing their values once they
 * are wide enough for a number, and the grid keeps only the weeks that fit at that
 * size. Drag `tileHeight` between here and `ShortTile` to watch it re-fit.
 */
export const TallTile: Story = {
	render: renderAdaptiveCalendarHeatmap,
	args: { ...SHORT_TILE_ARGS, tileHeight: 320 },
	decorators: [ withChartTheme ],
};

/**
 * Taller than any dashboard tile. The cells keep growing to fill it — trading week
 * columns for size, as the prototype does — and still reach the tile's full width.
 */
export const VeryTallTile: Story = {
	render: renderAdaptiveCalendarHeatmap,
	args: { ...SHORT_TILE_ARGS, tileHeight: 900 },
	decorators: [ withChartTheme ],
};

/**
 * One month of data in a tile that fits well over a year of columns. The month sits
 * at the right-hand edge and the weeks before it are filler: drawn so the tile fills,
 * but inert — no tooltip, no keyboard stop, no claim that those days had no traffic.
 */
export const ShortPeriod: Story = {
	render: renderAdaptiveCalendarHeatmap,
	args: { ...SHORT_TILE_ARGS, shortPeriod: true },
	decorators: [ withChartTheme ],
};

/**
 * A narrow tile: the oldest week columns fall away, and the cells that remain are
 * the size they are in the wide tiles above. Nothing scrolls or clips.
 */
export const NarrowTile: Story = {
	render: renderAdaptiveCalendarHeatmap,
	args: { ...SHORT_TILE_ARGS, tileWidth: 420, tileHeight: 320 },
	decorators: [ withChartTheme ],
};

/**
 * The current year, read at four points in it. Every row ends on the day the year has
 * reached and fills leftwards with filler weeks, so the tile is as full in January as
 * in December while the request only ever covers days that have happened.
 */
export const CurrentYearThroughTheYear: Story = {
	render: ( { tileWidth, tileHeight } ) => (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '16px' } }>
			{ CURRENT_YEAR_AS_OF.map( ( { label, endDate } ) => {
				const fetched = { startDate: '2026-01-01', endDate };

				return (
					<div key={ endDate }>
						<div
							style={ {
								marginBlockEnd: '4px',
								font: 'var(--wpds-typography-body-small)',
								color: 'var(--wpds-color-foreground-neutral-weak)',
							} }
						>
							{ label }
						</div>
						<TileCanvas width={ tileWidth } height={ tileHeight }>
							<AdaptiveCalendarHeatmap valueByDay={ buildViewsByDay( fetched ) } period={ fetched }>
								{ chartProps => (
									<HeatmapChartUnresponsive
										{ ...chartProps }
										primaryColor="var(--wp-admin-theme-color, #3858e9)"
										withTooltips
									/>
								) }
							</AdaptiveCalendarHeatmap>
						</TileCanvas>
					</div>
				);
			} ) }
		</div>
	),
	args: SHORT_TILE_ARGS,
	decorators: [ withChartTheme ],
};
