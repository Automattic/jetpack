/**
 * Internal dependencies
 */
import { calculateDelta } from '../../helpers/calculate-delta';
import { getCombinedPeriodMax } from '../../helpers/get-combined-period-max';
import { sharePercentage } from '../../helpers/share-percentage';
import {
	buildLeaderboardRow,
	type LeaderboardRowAction,
} from '../chart-leaderboard/leaderboard-row';
import type { LeaderboardChartData } from '../chart-leaderboard/leaderboard-chart';
import type { LeaderboardRowMedia } from '../chart-leaderboard/leaderboard-label';

type PostLinkAction = Extract< LeaderboardRowAction, { kind: 'postLink' } >;
type VideoLinkAction = Extract< LeaderboardRowAction, { kind: 'videoLink' } >;

type OptionalSearch< TAction extends { search: Record< string, unknown > } > = Omit<
	TAction,
	'search'
> & { search?: Record< string, unknown > };

/**
 * A row action as a widget declares it: the chart's actions, except that a detail link
 * may omit `search`, which the leaderboard fills with the dashboard's window.
 */
export type LeaderboardRowInputAction =
	| Exclude< LeaderboardRowAction, PostLinkAction | VideoLinkAction >
	| OptionalSearch< PostLinkAction >
	| OptionalSearch< VideoLinkAction >;

/**
 * One ranked row, in the widget's own terms.
 */
export type LeaderboardRowInput = {
	/**
	 * Stable row key.
	 */
	id: string;
	/**
	 * Label text.
	 */
	label: string;
	/**
	 * Value for the selected period.
	 */
	value: number;
	/**
	 * Value for the comparison period; `undefined` when the row has no match there.
	 */
	previousValue?: number;
	/**
	 * Media before the label. Defaults to none.
	 */
	media?: LeaderboardRowMedia;
	/**
	 * What selecting the row does. Defaults to nothing. A row with children drills down
	 * into them instead, when the leaderboard has a `drillDown`.
	 */
	action?: LeaderboardRowInputAction;
	/**
	 * Rows one level down, shown when the row is selected.
	 */
	children?: readonly LeaderboardRowInput[];
	/**
	 * Whether the children carry comparison values.
	 */
	childrenHaveComparison?: boolean;
};

/**
 * How the leaderboard turns a row with children into a drill-down.
 */
export type LeaderboardDrillDownOptions = {
	/**
	 * Called with the row the user drilled into.
	 */
	onSelect: ( row: LeaderboardRowInput ) => void;
	/**
	 * Accessible name of a row that drills down, e.g. "View clicked links for %s".
	 */
	rowAriaLabel: ( row: LeaderboardRowInput ) => string;
};

export type BuildLeaderboardChartDataOptions = {
	/**
	 * Whether the comparison period is on: shares and deltas read `previousValue` only then.
	 */
	hasComparison?: boolean;
	/**
	 * Rows past this count are dropped; `0` keeps every row.
	 */
	maxRows?: number;
	/**
	 * The dashboard window a detail link carries when the row declares none.
	 */
	detailSearch?: Record< string, unknown >;
	/**
	 * Makes every row with children a drill-down button. Without it, such rows keep their own action.
	 */
	drillDown?: LeaderboardDrillDownOptions;
};

const NO_MEDIA: LeaderboardRowMedia = { kind: 'none' };
const NO_ACTION: LeaderboardRowAction = { kind: 'static' };

function resolveAction(
	row: LeaderboardRowInput,
	detailSearch: Record< string, unknown >,
	drillDown: LeaderboardDrillDownOptions | undefined
): LeaderboardRowAction {
	// Children win over a link: a chart row cannot be a button and hold a link at once.
	if ( drillDown && row.children?.length ) {
		return {
			kind: 'drillDown',
			onClick: () => drillDown.onSelect( row ),
			ariaLabel: drillDown.rowAriaLabel( row ),
		};
	}

	const action = row.action;
	if ( ! action ) {
		return NO_ACTION;
	}
	if ( action.kind === 'postLink' || action.kind === 'videoLink' ) {
		return { ...action, search: action.search ?? detailSearch };
	}
	return action;
}

/**
 * Turn ranked rows into what `LeaderboardChart` draws: shares against the largest value
 * of either period, deltas where a comparison value exists, and the shared row chrome.
 *
 * @param rows                  - Ranked rows, in display order.
 * @param options               - Comparison, row limit, the detail-link window and the drill-down.
 * @param options.hasComparison - Whether the comparison period is on.
 * @param options.maxRows       - Rows past this count are dropped; `0` keeps every row.
 * @param options.detailSearch  - The dashboard window a detail link carries when the row declares none.
 * @param options.drillDown     - Makes every row with children a drill-down button.
 * @return The chart rows.
 */
export function buildLeaderboardChartData(
	rows: readonly LeaderboardRowInput[],
	{
		hasComparison = false,
		maxRows = 0,
		detailSearch = {},
		drillDown,
	}: BuildLeaderboardChartDataOptions = {}
): LeaderboardChartData {
	const visible = maxRows > 0 ? rows.slice( 0, maxRows ) : rows;
	const maxValue = getCombinedPeriodMax(
		visible.map( row => row.value ),
		hasComparison ? visible.map( row => row.previousValue ) : []
	);

	return visible.map( row => {
		const compared = hasComparison && row.previousValue !== undefined;

		return {
			id: row.id,
			...buildLeaderboardRow( {
				label: row.label,
				media: row.media ?? NO_MEDIA,
				action: resolveAction( row, detailSearch, drillDown ),
			} ),
			currentValue: row.value,
			currentShare: sharePercentage( row.value, maxValue ),
			previousValue: row.previousValue,
			previousShare: compared
				? sharePercentage( row.previousValue as number, maxValue )
				: undefined,
			delta: compared ? calculateDelta( row.value, row.previousValue as number ) : undefined,
		};
	} );
}
