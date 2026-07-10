const WEEK_STARTS_ON = 1;
const TRAILING_YEAR_DAYS = 365;
const COMPACT_CELL_SIZE = 11;
const COMPACT_CELL_GAP = 2;
const EXPANDED_TARGET_CELL_SIZE = 60;
const EXPANDED_CELL_GAP = 4;
const ROW_LABEL_COLUMN_WIDTH = 34;
const EXPANDED_WIDGET_MIN_SIZE = 370;

type HeatmapRangeOptions = {
	contentWidth?: number;
	contentHeight?: number;
	windowOffset?: number;
};

export type PostingActivityHeatmapRange = {
	queryStartDate?: string;
	queryEndDate?: string;
	startDate?: string;
	endDate?: string;
	compact: boolean;
	hasNavigation: boolean;
	windowOffset: number;
	maxWindowOffset: number;
	canNavigateOlder: boolean;
	canNavigateNewer: boolean;
};

const getDatePart = ( value?: string ) => value?.split( 'T' )[ 0 ];

function parseDatePart( datePart?: string ) {
	if ( ! datePart ) {
		return null;
	}

	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec( datePart );
	if ( ! match ) {
		return null;
	}

	const date = new Date(
		Date.UTC( Number( match[ 1 ] ), Number( match[ 2 ] ) - 1, Number( match[ 3 ] ) )
	);

	return formatDatePart( date ) === datePart ? date : null;
}

function formatDatePart( date: Date ) {
	const year = date.getUTCFullYear();
	const month = String( date.getUTCMonth() + 1 ).padStart( 2, '0' );
	const day = String( date.getUTCDate() ).padStart( 2, '0' );

	return `${ year }-${ month }-${ day }`;
}

function startOfWeek( date: Date ) {
	const start = new Date( date );
	const dayOffset = ( start.getUTCDay() - WEEK_STARTS_ON + 7 ) % 7;
	start.setUTCDate( start.getUTCDate() - dayOffset );
	start.setUTCHours( 0, 0, 0, 0 );

	return start;
}

function addDays( date: Date, days: number ) {
	const next = new Date( date );
	next.setUTCDate( next.getUTCDate() + days );

	return next;
}

function getCalendarWeekCount( startDate: Date, endDate: Date ) {
	const firstWeek = startOfWeek( startDate );
	const lastWeek = startOfWeek( endDate );

	return (
		Math.floor( ( lastWeek.getTime() - firstWeek.getTime() ) / ( 7 * 24 * 60 * 60 * 1000 ) ) + 1
	);
}

function getWeekCountForWidth( contentWidth: number, cellSize: number, cellGap: number ) {
	if ( contentWidth <= 0 ) {
		return 0;
	}

	const availableGridWidth = Math.max( 0, contentWidth - ROW_LABEL_COLUMN_WIDTH );

	return Math.floor( ( availableGridWidth + cellGap ) / ( cellSize + cellGap ) );
}

export function normalizePostingActivityWindowOffset(
	value?: number,
	maxWindowOffset = Number.MAX_SAFE_INTEGER
) {
	if ( typeof value !== 'number' || ! Number.isFinite( value ) ) {
		return 0;
	}

	const maxOffset = Math.max( 0, Math.trunc( maxWindowOffset ) );
	return Math.max( 0, Math.min( Math.trunc( value ), maxOffset ) );
}

function shouldUseCompactCells( contentWidth = 0, contentHeight = 0 ) {
	return contentWidth < EXPANDED_WIDGET_MIN_SIZE || contentHeight < EXPANDED_WIDGET_MIN_SIZE;
}

function getVisibleWeekCount( fullWeekCount: number, compact: boolean, contentWidth = 0 ) {
	if ( contentWidth <= 0 ) {
		return fullWeekCount;
	}

	const visibleWeekCount = compact
		? getWeekCountForWidth( contentWidth, COMPACT_CELL_SIZE, COMPACT_CELL_GAP )
		: getWeekCountForWidth( contentWidth, EXPANDED_TARGET_CELL_SIZE, EXPANDED_CELL_GAP );

	return Math.max( 1, Math.min( fullWeekCount, visibleWeekCount ) );
}

export function getPostingActivityHeatmapRange(
	to?: string,
	{ contentWidth = 0, contentHeight = 0, windowOffset = 0 }: HeatmapRangeOptions = {}
): PostingActivityHeatmapRange {
	const queryEndDate = getDatePart( to );
	const yearEndDate = parseDatePart( queryEndDate );
	const compact = shouldUseCompactCells( contentWidth, contentHeight );

	if ( ! yearEndDate ) {
		return {
			queryEndDate,
			endDate: queryEndDate,
			compact,
			hasNavigation: false,
			windowOffset: 0,
			maxWindowOffset: 0,
			canNavigateOlder: false,
			canNavigateNewer: false,
		};
	}

	const yearStartDate = addDays( yearEndDate, -1 * ( TRAILING_YEAR_DAYS - 1 ) );
	const fullWeekCount = getCalendarWeekCount( yearStartDate, yearEndDate );
	const visibleWeekCount = getVisibleWeekCount( fullWeekCount, compact, contentWidth );
	const hasNavigation = visibleWeekCount < fullWeekCount;

	if ( ! hasNavigation ) {
		return {
			queryStartDate: formatDatePart( yearStartDate ),
			queryEndDate,
			startDate: formatDatePart( yearStartDate ),
			endDate: queryEndDate,
			compact,
			hasNavigation,
			windowOffset: 0,
			maxWindowOffset: 0,
			canNavigateOlder: false,
			canNavigateNewer: false,
		};
	}

	const pageCount = Math.ceil( fullWeekCount / visibleWeekCount );
	const maxWindowOffset = pageCount - 1;
	const pageOffset = normalizePostingActivityWindowOffset( windowOffset, maxWindowOffset );
	const endWeekStart = addDays(
		startOfWeek( yearEndDate ),
		-1 * pageOffset * visibleWeekCount * 7
	);
	const startWeek = addDays( endWeekStart, -1 * ( visibleWeekCount - 1 ) * 7 );
	const windowStartDate = startWeek < yearStartDate ? yearStartDate : startWeek;
	const pageEndDate = pageOffset === 0 ? yearEndDate : addDays( endWeekStart, 6 );
	const windowEndDate = pageEndDate > yearEndDate ? yearEndDate : pageEndDate;

	return {
		queryStartDate: formatDatePart( yearStartDate ),
		queryEndDate,
		startDate: formatDatePart( windowStartDate ),
		endDate: formatDatePart( windowEndDate ),
		compact,
		hasNavigation,
		windowOffset: pageOffset,
		maxWindowOffset,
		canNavigateOlder: pageOffset < maxWindowOffset,
		canNavigateNewer: pageOffset > 0,
	};
}
