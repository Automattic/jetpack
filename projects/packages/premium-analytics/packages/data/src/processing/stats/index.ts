/**
 * Internal dependencies
 */
import { safeParseFloat } from '../../utils/parsing';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsItemAction = {
	type: string;
	data: unknown;
};

export type StatsNormalizedItemBase< TChild = unknown > = {
	label: unknown;
	children?: TChild[] | null;
};

export interface StatsTopPostsItem extends StatsNormalizedItemBase< StatsTopPostsItem > {
	id?: string | number;
	views: number;
	link: string | null;
	page?: string | null;
	public?: unknown;
	type?: unknown;
	date?: unknown;
	status?: unknown;
	video_play?: unknown;
	actions?: StatsItemAction[];
}

export interface StatsReferrersItem extends StatsNormalizedItemBase< StatsReferrersItem > {
	views: number;
	link: string | null;
	icon: string | null;
	labelIcon: string | null;
	actions?: StatsItemAction[];
	actionMenu?: number;
}

export interface StatsClicksItem extends StatsNormalizedItemBase< StatsClicksItem > {
	views: number;
	link: string | null;
	icon: string | null;
	labelIcon: string | null;
}

export type StatsSearchTermsItem = StatsNormalizedItemBase & {
	views: number;
	className: string;
	children: null;
};

export type StatsFileDownloadsItem = StatsNormalizedItemBase & {
	downloads: number;
	shortLabel?: string;
	link?: string;
	linkTitle: unknown;
	labelIcon: string;
	children: null;
};

export type StatsTopAuthorsItem = StatsNormalizedItemBase< StatsTopPostsItem > & {
	views: number;
	icon: string | null;
	iconClassName?: string;
	className?: string | null;
};

export type StatsLocationsItem = StatsNormalizedItemBase & {
	views: number;
	countryCode?: string;
	countryFull?: string;
	region?: string;
	coordinates?: unknown;
	children: null;
};

export type StatsVideoPlaysItem = StatsNormalizedItemBase & {
	id?: string | number;
	plays: number;
	impressions: number;
	watch_time: number;
	retention_rate: number;
	link: string | null;
	children: null;
};

export type StatsNormalizedItem =
	| StatsTopPostsItem
	| StatsReferrersItem
	| StatsClicksItem
	| StatsSearchTermsItem
	| StatsFileDownloadsItem
	| StatsTopAuthorsItem
	| StatsLocationsItem
	| StatsVideoPlaysItem;

export type StatsNormalizedDataPoint< TItem extends StatsNormalizedItem = StatsNormalizedItem > = {
	time_interval: string;
	date_start: string;
	date_end: string;
	items: TItem[];
	[ key: string ]: unknown;
};

export type StatsNormalizedSummary = {
	date_start?: string;
	date_end?: string;
	[ key: string ]: unknown;
};

export type StatsNormalizedReport< TItem extends StatsNormalizedItem = StatsNormalizedItem > = {
	summary: StatsNormalizedSummary;
	data: Array< StatsNormalizedDataPoint< TItem > >;
};

type StatsRecord = Record< string, unknown >;
type StatsIntervalFields = Pick<
	StatsNormalizedDataPoint,
	'time_interval' | 'date_start' | 'date_end'
>;

function isStatsRecord( value: unknown ): value is StatsRecord {
	return value && typeof value === 'object' && ! Array.isArray( value ) ? true : false;
}

function getStatsRecord( value: unknown ): StatsRecord {
	return isStatsRecord( value ) ? value : {};
}

function getStatsArray< T = StatsRecord >( value: unknown ): T[] {
	return Array.isArray( value ) ? ( value as T[] ) : [];
}

function normalizeStatsSummary(
	value: StatsRecord,
	excludedKeys: string[] = []
): StatsNormalizedSummary {
	return Object.fromEntries(
		Object.entries( value )
			.filter( ( [ key ] ) => ! excludedKeys.includes( key ) )
			.map( ( [ key, item ] ) => [
				key,
				key === 'date_start' || key === 'date_end' || typeof item === 'object'
					? item
					: safeParseFloat( item ),
			] )
	);
}

function getDatePart( value: unknown ): string | undefined {
	return typeof value === 'string' ? value.split( 'T' )[ 0 ] : undefined;
}

function getStatsEndDateParam( query?: StatsQueryParams ): string | undefined {
	return getDatePart( query?.end_date ?? query?.date );
}

function getStatsResponseDate( response: unknown ): string | undefined {
	return getDatePart( getStatsRecord( response ).date );
}

function getStatsResponsePeriod( response: unknown ): string | undefined {
	const period = getStatsRecord( response ).period;

	return typeof period === 'string' ? period : undefined;
}

function formatNormalizedDateTime( date: string, time: string ): string {
	return `${ date }T${ time }+00:00`;
}

function getStartDatePart( date: string, period?: string ): string {
	const datePart = date.split( 'T' )[ 0 ];

	if ( period === 'year' && /^\d{4}$/.test( datePart ) ) {
		return `${ datePart }-01-01`;
	}

	if ( period === 'month' && /^\d{4}-\d{2}$/.test( datePart ) ) {
		return `${ datePart }-01`;
	}

	return datePart;
}

function parseDatePart( date: string ): Date | null {
	const match = date.match( /^(\d{4})-(\d{2})-(\d{2})$/ );

	if ( ! match ) {
		return null;
	}

	return new Date(
		Date.UTC(
			Number.parseInt( match[ 1 ], 10 ),
			Number.parseInt( match[ 2 ], 10 ) - 1,
			Number.parseInt( match[ 3 ], 10 )
		)
	);
}

function formatDatePart( date: Date ): string {
	return [
		date.getUTCFullYear(),
		String( date.getUTCMonth() + 1 ).padStart( 2, '0' ),
		String( date.getUTCDate() ).padStart( 2, '0' ),
	].join( '-' );
}

function addUtcDays( date: Date, days: number ): Date {
	const next = new Date( date.getTime() );
	next.setUTCDate( next.getUTCDate() + days );
	return next;
}

function getEndDatePart( startDate: string, period?: string ): string {
	const parsed = parseDatePart( startDate );

	if ( ! parsed ) {
		return startDate;
	}

	switch ( period ) {
		case 'week':
			return formatDatePart( addUtcDays( parsed, 6 ) );
		case 'month':
			return formatDatePart(
				new Date( Date.UTC( parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 0 ) )
			);
		case 'year':
			return `${ parsed.getUTCFullYear() }-12-31`;
		case 'hour':
		case 'day':
		default:
			return startDate;
	}
}

function getStatsIntervalFields( date: string, period?: string ): StatsIntervalFields {
	const startDate = getStartDatePart( date, period );
	const endDate = getEndDatePart( startDate, period );

	return {
		time_interval: date,
		date_start: formatNormalizedDateTime( startDate, '00:00:00' ),
		date_end: formatNormalizedDateTime( endDate, '23:59:59' ),
	};
}

function getStatsSummaryIntervalFields(
	query?: StatsQueryParams,
	response?: unknown
): Partial< StatsIntervalFields > {
	const responseDate = getStatsResponseDate( response );
	const startDate =
		getDatePart( query?.start_date ) ?? getStatsEndDateParam( query ) ?? responseDate;
	const endDate = getStatsEndDateParam( query ) ?? responseDate ?? getDatePart( query?.start_date );

	return {
		...( startDate ? { date_start: formatNormalizedDateTime( startDate, '00:00:00' ) } : {} ),
		...( endDate ? { date_end: formatNormalizedDateTime( endDate, '23:59:59' ) } : {} ),
	};
}

function getStatsTopLevelDataDate(
	response: unknown,
	query?: StatsQueryParams
): string | undefined {
	return (
		getStatsResponseDate( response ) ??
		getStatsEndDateParam( query ) ??
		getDatePart( query?.start_date )
	);
}

function getStatsTopLevelPeriod( response: unknown, query?: StatsQueryParams ): string | undefined {
	return query?.period ?? getStatsResponsePeriod( response );
}

function normalizeStatsReportSummary(
	response: unknown,
	query?: StatsQueryParams,
	excludedKeys: string[] = []
): StatsNormalizedSummary {
	return query?.summarize
		? {
				...normalizeStatsSummary(
					getStatsRecord( getStatsRecord( response ).summary ),
					excludedKeys
				),
				...getStatsSummaryIntervalFields( query, response ),
		  }
		: {};
}

function getStatsBuckets( response: unknown, query: StatsQueryParams = {} ) {
	if ( query.summarize ) {
		return [];
	}

	const payload = getStatsRecord( response );
	const days = getStatsRecord( payload.days );
	const startDate = getDatePart( query.start_date );
	const endDate = getStatsEndDateParam( query );

	if ( endDate && ! startDate && days[ endDate ] ) {
		return [ [ endDate, getStatsRecord( days[ endDate ] ) ] ] as const;
	}

	return Object.entries( days ).map( ( [ key, value ] ) => [
		key,
		getStatsRecord( value ),
	] ) as Array< readonly [ string, StatsRecord ] >;
}

function createStatsDataPoint< TItem extends StatsNormalizedItem >(
	date: string,
	period: string | undefined,
	items: TItem[]
): StatsNormalizedDataPoint< TItem > {
	return {
		...getStatsIntervalFields( date, period ),
		items,
	};
}

function createStatsSummaryDataPoint< TItem extends StatsNormalizedItem >(
	date: string,
	response: unknown,
	query: StatsQueryParams | undefined,
	items: TItem[]
): StatsNormalizedDataPoint< TItem > {
	return {
		...getStatsIntervalFields( date, getStatsTopLevelPeriod( response, query ) ),
		...getStatsSummaryIntervalFields( query, response ),
		items,
	};
}

function mapStatsDataPoints< TItem extends StatsNormalizedItem >(
	response: unknown,
	query: StatsQueryParams | undefined,
	key: string,
	mapper: ( item: StatsRecord ) => TItem
): Array< StatsNormalizedDataPoint< TItem > > {
	return getStatsBuckets( response, query ).map( ( [ date, bucket ] ) =>
		createStatsDataPoint(
			date,
			query?.period ?? getStatsResponsePeriod( response ),
			getStatsArray< StatsRecord >( bucket[ key ] ).map( mapper )
		)
	);
}

function getStatsArrayFromKeys< T = StatsRecord >(
	source: StatsRecord,
	keys: string[]
): { found: boolean; items: T[] } {
	for ( const key of keys ) {
		if ( Array.isArray( source[ key ] ) ) {
			return {
				found: true,
				items: getStatsArray< T >( source[ key ] ),
			};
		}
	}

	return {
		found: false,
		items: [],
	};
}

function mapStatsSummaryDataPoint< TItem extends StatsNormalizedItem >(
	response: unknown,
	query: StatsQueryParams | undefined,
	keys: string[],
	mapper: ( item: StatsRecord ) => TItem
): Array< StatsNormalizedDataPoint< TItem > > {
	if ( ! query?.summarize ) {
		return [];
	}

	const summary = getStatsRecord( getStatsRecord( response ).summary );
	const { found, items } = getStatsArrayFromKeys< StatsRecord >( summary, keys );
	const summaryDate = getStatsTopLevelDataDate( response, query );

	return found && summaryDate
		? [ createStatsSummaryDataPoint( summaryDate, response, query, items.map( mapper ) ) ]
		: [];
}

function mapStatsReportDataPoints< TItem extends StatsNormalizedItem >(
	response: unknown,
	query: StatsQueryParams | undefined,
	keys: string[],
	mapper: ( item: StatsRecord ) => TItem
): Array< StatsNormalizedDataPoint< TItem > > {
	const summaryData = mapStatsSummaryDataPoint( response, query, keys, mapper );

	return summaryData.length
		? summaryData
		: mapStatsDataPoints( response, query, keys[ 0 ], mapper );
}

function mapNestedItems< TItem >( items: StatsRecord[], mapper: ( item: StatsRecord ) => TItem ) {
	const children = items.map( item => mapper( item ) );

	return children.length ? children : null;
}

export function sanitizeStatsPassthroughResponse< T >( response: T ): T {
	return response;
}

export function sanitizeStatsSiteResponse( response: unknown ) {
	const payload = getStatsRecord( response );

	return {
		...payload,
		stats: normalizeStatsSummary( getStatsRecord( payload.stats ) ),
	};
}

export function combineStatsNormalizedReports< TItem extends StatsNormalizedItem >(
	summaryReport?: Pick< StatsNormalizedReport< TItem >, 'summary' | 'data' >,
	dataReport?: Pick< StatsNormalizedReport< TItem >, 'data' >
): StatsNormalizedReport< TItem > {
	return {
		summary: summaryReport?.summary ?? {},
		data: dataReport?.data ?? summaryReport?.data ?? [],
	};
}

function getStatsTopPostLink( item: StatsRecord ): string | null {
	if ( typeof item.href === 'string' ) {
		return item.href;
	}

	if ( typeof item.link === 'string' ) {
		return item.link;
	}

	return null;
}

function normalizeStatsTopPostItem( item: StatsRecord ): StatsTopPostsItem {
	const link = getStatsTopPostLink( item );

	return {
		id: item.id as string | number | undefined,
		label: item.title,
		views: safeParseFloat( item.views ),
		link,
		page: item.id ? `/stats/post/${ item.id }` : null,
		public: item.public,
		type: item.type,
		date: item.date,
		status: item.status,
		video_play: item.video_play,
		actions: link ? [ { type: 'link', data: link } ] : [],
		children: mapNestedItems( getStatsArray( item.children ), normalizeStatsTopPostItem ),
	};
}

function normalizeStatsTopPostsData(
	response: unknown,
	query?: StatsQueryParams
): Array< StatsNormalizedDataPoint< StatsTopPostsItem > > {
	return mapStatsReportDataPoints( response, query, [ 'postviews' ], normalizeStatsTopPostItem );
}

export function sanitizeStatsTopPostsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsTopPostsItem > {
	return {
		summary: normalizeStatsReportSummary( response, query, [ 'postviews' ] ),
		data: normalizeStatsTopPostsData( response, query ),
	};
}

export function sanitizeStatsReferrersResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsReferrersItem > {
	const parse = ( item: StatsRecord ): StatsReferrersItem => ( {
		label: item.name ?? item.group ?? '',
		views: safeParseFloat( item.views ?? item.total ),
		link: typeof item.url === 'string' ? item.url : null,
		icon: typeof item.icon === 'string' ? item.icon : null,
		labelIcon: item.results || item.children ? null : 'external',
		children: mapNestedItems( getStatsArray( item.results ?? item.children ), parse ),
	} );

	return {
		summary: normalizeStatsReportSummary( response, query, [ 'groups' ] ),
		data: mapStatsReportDataPoints( response, query, [ 'groups' ], item => {
			const results = getStatsArray< StatsRecord >( item.results );
			const normalized = parse( results.length === 1 ? results[ 0 ] : item );
			const domain = item.name ?? item.group;
			const canSpam = typeof domain === 'string' && domain.includes( '.' );

			return {
				...normalized,
				actions: canSpam ? [ { type: 'spam', data: { domain } } ] : [],
				actionMenu: canSpam ? 1 : 0,
			};
		} ),
	};
}

export function sanitizeStatsClicksResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsClicksItem > {
	const parse = ( item: StatsRecord ): StatsClicksItem => ( {
		label: item.name ?? '',
		views: safeParseFloat( item.views ),
		link: typeof item.url === 'string' ? item.url : null,
		icon: typeof item.icon === 'string' ? item.icon : null,
		labelIcon: getStatsArray( item.children ).length ? null : 'external',
		children: mapNestedItems( getStatsArray( item.children ), child => ( {
			label:
				typeof child.name === 'string' && typeof item.name === 'string'
					? child.name.split( item.name ).join( '' ) || '/'
					: '/',
			views: safeParseFloat( child.views ),
			link: typeof child.url === 'string' ? child.url : null,
			icon: null,
			labelIcon: 'external',
			children: null,
		} ) ),
	} );

	return {
		summary: normalizeStatsReportSummary( response, query, [ 'clicks' ] ),
		data: mapStatsReportDataPoints( response, query, [ 'clicks' ], parse ),
	};
}

export function sanitizeStatsSearchTermsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsSearchTermsItem > {
	return {
		summary: normalizeStatsReportSummary( response, query, [ 'search_terms' ] ),
		data: mapStatsReportDataPoints( response, query, [ 'search_terms' ], item => ( {
			label: item.term,
			views: safeParseFloat( item.views ),
			className: 'user-selectable',
			children: null,
		} ) ),
	};
}

export function sanitizeStatsFileDownloadsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsFileDownloadsItem > {
	const getLink = ( item: StatsRecord ): string | undefined => {
		if ( typeof item.download_url === 'string' ) {
			return item.download_url;
		}

		return typeof item.relative_url === 'string' ? item.relative_url : undefined;
	};

	return {
		summary: normalizeStatsReportSummary( response, query, [ 'files' ] ),
		data: mapStatsReportDataPoints( response, query, [ 'files' ], item => ( {
			label: item.relative_url,
			downloads: safeParseFloat( item.download_count ?? item.downloads ),
			shortLabel: typeof item.filename === 'string' ? item.filename : undefined,
			link: getLink( item ),
			linkTitle: item.relative_url,
			labelIcon: 'external',
			children: null,
		} ) ),
	};
}

export function sanitizeStatsTopAuthorsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsTopAuthorsItem > {
	return {
		summary: normalizeStatsReportSummary( response, query, [ 'authors' ] ),
		data: mapStatsReportDataPoints( response, query, [ 'authors' ], item => ( {
			label: item.name || 'Untracked Authors',
			views: safeParseFloat( item.views ),
			icon: typeof item.avatar === 'string' ? item.avatar : null,
			iconClassName: 'avatar-user',
			className: 'module-content-list-item-large',
			children: mapNestedItems( getStatsArray( item.posts ), post => ( {
				id: post.id as string | number | undefined,
				label: post.title,
				views: safeParseFloat( post.views ),
				link: typeof post.url === 'string' ? post.url : null,
				page: post.id ? `/stats/post/${ post.id }` : null,
				children: null,
			} ) ),
		} ) ),
	};
}

export function sanitizeStatsLocationsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsLocationsItem > {
	const payload = getStatsRecord( response );
	const countryInfo = getStatsRecord( payload[ 'country-info' ] ?? payload.countryInfo );
	const parse = ( item: StatsRecord ): StatsLocationsItem => {
		const country = getStatsRecord(
			typeof item.country_code === 'string' ? countryInfo[ item.country_code ] : undefined
		);
		const label = item.location ?? country.country_full ?? item.country_code ?? '';

		return {
			label: typeof label === 'string' ? label.replace( /’/g, "'" ) : label,
			views: safeParseFloat( item.views ),
			countryCode: typeof item.country_code === 'string' ? item.country_code : undefined,
			countryFull: typeof country.country_full === 'string' ? country.country_full : undefined,
			region: typeof country.map_region === 'string' ? country.map_region : undefined,
			coordinates: item.coordinates,
			children: null,
		};
	};

	const filterLocations = ( items: StatsRecord[] ) =>
		items.filter(
			item =>
				typeof item.country_code !== 'string' ||
				! [ 'A1', 'A2', 'ZZ' ].includes( item.country_code )
		);
	const mapItems = ( items: StatsRecord[] ) => filterLocations( items ).map( parse );
	const summary = getStatsRecord( payload.summary );
	const summaryViews = getStatsArrayFromKeys< StatsRecord >( summary, [ 'views' ] );
	const summaryDate = getStatsTopLevelDataDate( response, query );
	const summaryData =
		query?.summarize && summaryViews.found && summaryDate
			? [
					createStatsSummaryDataPoint(
						summaryDate,
						response,
						query,
						mapItems( summaryViews.items )
					),
			  ]
			: [];

	return {
		summary: normalizeStatsReportSummary( response, query, [ 'views' ] ),
		data: summaryData.length
			? summaryData
			: getStatsBuckets( response, query ).map( ( [ date, bucket ] ) =>
					createStatsDataPoint(
						date,
						query?.period ?? getStatsResponsePeriod( response ),
						mapItems( getStatsArray( bucket.views ) )
					)
			  ),
	};
}

export function sanitizeStatsVideoPlaysResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsVideoPlaysItem > {
	const videoDataKeys = query?.complete_stats ? [ 'data', 'plays' ] : [ 'plays', 'data' ];
	const parse = ( item: StatsRecord ): StatsVideoPlaysItem => ( {
		id: item.post_id as string | number | undefined,
		label: item.title,
		plays: safeParseFloat( item.views ?? item.plays ),
		impressions: safeParseFloat( item.impressions ),
		watch_time: safeParseFloat( item.watch_time ),
		retention_rate: safeParseFloat( item.retention_rate ),
		link: typeof item.url === 'string' ? item.url : null,
		children: null,
	} );

	return {
		summary: normalizeStatsReportSummary( response, query, videoDataKeys ),
		data: mapStatsReportDataPoints( response, query, videoDataKeys, parse ),
	};
}
