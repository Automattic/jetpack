import { WidgetCard } from '../../../stories/widget-card';
import { withChartTheme } from '../../../stories/with-chart-theme';
import { MonthCalendarHeatmap } from '../month-calendar-heatmap';
import type { MonthCalendarHeatmapProps } from '../month-calendar-heatmap';
import type { Meta, StoryObj } from '@storybook/react';

// Fixed days: a story that moved with the clock would render differently on
// every visual diff. The range ends mid-month so the last block has filler.
const RANGE_END = '2026-09-14';

const LABELS = {
	ariaLabel: 'Monthly posting activity',
	formatValue: ( value: number ) => ( value === 1 ? '1 post' : `${ value } posts` ),
	emptyLabel: 'No posts',
	lessLabel: 'Fewer posts',
	moreLabel: 'More posts',
};

/**
 * The first of the month `months - 1` months before the range end.
 *
 * @param months - How many months the range covers.
 * @return The range start, `yyyy-MM-dd`.
 */
function rangeStart( months: number ) {
	const end = new Date( `${ RANGE_END }T00:00:00Z` );
	const start = new Date( Date.UTC( end.getUTCFullYear(), end.getUTCMonth() - ( months - 1 ), 1 ) );

	return start.toISOString().slice( 0, 10 );
}

/**
 * A deterministic sparse series: about half the days have posts, in clusters,
 * so the calendar reads as real posting activity rather than uniform noise.
 *
 * @param start - First day, `yyyy-MM-dd`.
 * @return Posts per day for the days from `start` to the range end.
 */
function buildPostsByDay( start: string ) {
	const postsByDay: Record< string, number > = {};
	const day = new Date( `${ start }T00:00:00Z` );
	const end = new Date( `${ RANGE_END }T00:00:00Z` );

	// Park–Miller LCG: deterministic, stays within safe-integer range, no bitwise ops.
	let seed = 1337;
	const nextRandom = () => {
		seed = ( seed * 16807 ) % 2147483647;
		return seed / 2147483647;
	};

	for ( ; day.getTime() <= end.getTime(); day.setUTCDate( day.getUTCDate() + 1 ) ) {
		if ( nextRandom() < 0.55 ) {
			continue;
		}
		postsByDay[ day.toISOString().slice( 0, 10 ) ] = 1 + Math.floor( nextRandom() * 5 );
	}

	return postsByDay;
}

interface MonthCalendarHeatmapStoryControls {
	/** How many months to draw, ending with September 2026. */
	months: number;
	/** Width of the mock tile, in px. Drives whether the blocks spread or the grid scrolls. */
	tileWidth: number;
	/** Height of the mock tile, in px. Below 140px the legend is dropped. */
	tileHeight: number;
}

type MonthCalendarHeatmapStoryArgs = MonthCalendarHeatmapStoryControls &
	Pick< MonthCalendarHeatmapProps, 'weekStartsOn' >;

function renderMonthCalendarHeatmap( {
	months,
	tileWidth,
	tileHeight,
	weekStartsOn,
}: MonthCalendarHeatmapStoryArgs ) {
	const start = rangeStart( months );

	return (
		<WidgetCard width={ `${ tileWidth }px` } height={ `${ tileHeight }px` }>
			<MonthCalendarHeatmap
				valueByDay={ buildPostsByDay( start ) }
				range={ { start, end: RANGE_END } }
				weekStartsOn={ weekStartsOn }
				{ ...LABELS }
			/>
		</WidgetCard>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/MonthCalendarHeatmap',
	component: MonthCalendarHeatmap,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'One mini calendar per month on a shared scale, months across with their names beneath, as the Posting activity widget draws its last 12 months. Days of the first and last month outside the range are faded filler with no tooltip. In a wide tile the blocks spread out; in a narrow one the gaps shrink to the chart minimum and then only the grid scrolls, keeping the legend in place. A tile too short for a legend (a one-row dashboard tile) drops it. Drag `tileWidth` and `tileHeight` to watch both.',
			},
		},
	},
	argTypes: {
		months: { control: { type: 'range', min: 1, max: 12, step: 1 } },
		tileWidth: { control: { type: 'range', min: 360, max: 1600, step: 20 } },
		tileHeight: { control: { type: 'range', min: 100, max: 500, step: 8 } },
		weekStartsOn: {
			control: 'radio',
			options: [ 1, 0 ],
			labels: { 1: 'Monday', 0: 'Sunday' },
		},
	},
	decorators: [ withChartTheme ],
	// `component` is the component's own props, but the args are story controls:
	// intersect the two so both type-check.
} satisfies Meta< MonthCalendarHeatmapProps & MonthCalendarHeatmapStoryControls >;

export default meta;

type Story = StoryObj< MonthCalendarHeatmapStoryArgs >;

const DEFAULT_ARGS: MonthCalendarHeatmapStoryArgs = {
	months: 12,
	tileWidth: 1400,
	tileHeight: 300,
	weekStartsOn: 1,
};

/**
 * Twelve months in a tile wide enough for the blocks to spread out. The last
 * block closes with filler after the 14th.
 */
export const Default: Story = {
	render: renderMonthCalendarHeatmap,
	args: DEFAULT_ARGS,
};

/**
 * Narrower than the twelve blocks at the minimum gap: the grid scrolls sideways
 * on its own while the legend stays put.
 */
export const Scrolling: Story = {
	render: renderMonthCalendarHeatmap,
	args: { ...DEFAULT_ARGS, tileWidth: 720 },
};

/**
 * A one-row dashboard tile: the legend is dropped so the blocks keep their room.
 */
export const ShortTile: Story = {
	render: renderMonthCalendarHeatmap,
	args: { ...DEFAULT_ARGS, tileHeight: 140 },
};

/**
 * Weeks starting on Sunday, for a site set that way.
 */
export const SundayStart: Story = {
	render: renderMonthCalendarHeatmap,
	args: { ...DEFAULT_ARGS, weekStartsOn: 0 },
};
