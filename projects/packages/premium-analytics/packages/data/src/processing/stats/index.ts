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

export type StatsTopPostsItem = StatsNormalizedItemBase & {
	id?: string | number;
	views: number;
	link: string | null;
	page?: string | null;
	public?: unknown;
	type?: unknown;
	actions?: StatsItemAction[];
};

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

function isStatsRecord( value: unknown ): value is StatsRecord {
	return value && typeof value === 'object' && ! Array.isArray( value ) ? true : false;
}

function getStatsRecord( value: unknown ): StatsRecord {
	return isStatsRecord( value ) ? value : {};
}

function getStatsArray< T = StatsRecord >( value: unknown ): T[] {
	return Array.isArray( value ) ? ( value as T[] ) : [];
}

function normalizeStatsSummary( value: StatsRecord ): StatsNormalizedSummary {
	return Object.fromEntries(
		Object.entries( value ).map( ( [ key, item ] ) => [
			key,
			key === 'date_start' || key === 'date_end' ? item : safeParseFloat( item ),
		] )
	);
}

function normalizeStatsReportSummary(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedSummary {
	return query?.summarize
		? normalizeStatsSummary( getStatsRecord( getStatsRecord( response ).summary ) )
		: {};
}

function getStatsBuckets( response: unknown, query: StatsQueryParams = {} ) {
	if ( query.summarize ) {
		return [];
	}

	const payload = getStatsRecord( response );
	const days = getStatsRecord( payload.days );
	const requested = query.date ?? query.start_date;

	if ( requested && days[ requested ] ) {
		return [ [ requested, getStatsRecord( days[ requested ] ) ] ] as const;
	}

	return Object.entries( days ).map( ( [ key, value ] ) => [
		key,
		getStatsRecord( value ),
	] ) as Array< readonly [ string, StatsRecord ] >;
}

function getString( value: unknown, fallback = '' ): string {
	return typeof value === 'string' ? value : fallback;
}

function createStatsDataPoint< TItem extends StatsNormalizedItem >(
	date: string,
	bucket: StatsRecord,
	items: TItem[]
): StatsNormalizedDataPoint< TItem > {
	return {
		time_interval: getString( bucket.time_interval, date ),
		date_start: getString( bucket.date_start, date ),
		date_end: getString( bucket.date_end, date ),
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
			bucket,
			getStatsArray< StatsRecord >( bucket[ key ] ).map( mapper )
		)
	);
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
	summaryReport?: Pick< StatsNormalizedReport< TItem >, 'summary' >,
	dataReport?: Pick< StatsNormalizedReport< TItem >, 'data' >
): StatsNormalizedReport< TItem > {
	return {
		summary: summaryReport?.summary ?? {},
		data: dataReport?.data ?? [],
	};
}

export function sanitizeStatsTopPostsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsTopPostsItem > {
	return {
		summary: normalizeStatsReportSummary( response, query ),
		data: mapStatsDataPoints( response, query, 'postviews', item => ( {
			id: item.id as string | number | undefined,
			label: item.title,
			views: safeParseFloat( item.views ),
			link: typeof item.href === 'string' ? item.href : null,
			page: item.id ? `/stats/post/${ item.id }` : null,
			public: item.public,
			type: item.type,
			actions: item.href ? [ { type: 'link', data: item.href } ] : [],
			children: null,
		} ) ),
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
		summary: normalizeStatsReportSummary( response, query ),
		data: mapStatsDataPoints( response, query, 'groups', item => {
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
		summary: normalizeStatsReportSummary( response, query ),
		data: mapStatsDataPoints( response, query, 'clicks', parse ),
	};
}

export function sanitizeStatsSearchTermsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsSearchTermsItem > {
	return {
		summary: normalizeStatsReportSummary( response, query ),
		data: mapStatsDataPoints( response, query, 'search_terms', item => ( {
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
	return {
		summary: normalizeStatsReportSummary( response, query ),
		data: mapStatsDataPoints( response, query, 'files', item => ( {
			label: item.relative_url,
			downloads: safeParseFloat( item.downloads ),
			shortLabel: typeof item.filename === 'string' ? item.filename : undefined,
			link: typeof item.download_url === 'string' ? item.download_url : undefined,
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
		summary: normalizeStatsReportSummary( response, query ),
		data: mapStatsDataPoints( response, query, 'authors', item => ( {
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

	return {
		summary: normalizeStatsReportSummary( response, query ),
		data: getStatsBuckets( response, query ).map( ( [ date, bucket ] ) => {
			const filteredViews = getStatsArray< StatsRecord >( bucket.views ).filter(
				item =>
					typeof item.country_code !== 'string' ||
					! [ 'A1', 'A2', 'ZZ' ].includes( item.country_code )
			);

			return createStatsDataPoint(
				date,
				bucket,
				filteredViews.map( item => {
					const country = getStatsRecord(
						typeof item.country_code === 'string' ? countryInfo[ item.country_code ] : undefined
					);
					const label = item.location ?? country.country_full ?? item.country_code ?? '';

					return {
						label: typeof label === 'string' ? label.replace( /’/g, "'" ) : label,
						views: safeParseFloat( item.views ),
						countryCode: typeof item.country_code === 'string' ? item.country_code : undefined,
						countryFull:
							typeof country.country_full === 'string' ? country.country_full : undefined,
						region: typeof country.map_region === 'string' ? country.map_region : undefined,
						coordinates: item.coordinates,
						children: null,
					};
				} )
			);
		} ),
	};
}

export function sanitizeStatsVideoPlaysResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsVideoPlaysItem > {
	return {
		summary: normalizeStatsReportSummary( response, query ),
		data: getStatsBuckets( response, query ).map( ( [ date, bucket ] ) => {
			const videoData = query?.complete_stats
				? getStatsArray< StatsRecord >( bucket.data )
				: getStatsArray< StatsRecord >( bucket.plays );

			return createStatsDataPoint(
				date,
				bucket,
				videoData.map( item => ( {
					id: item.post_id as string | number | undefined,
					label: item.title,
					plays: safeParseFloat( item.views ?? item.plays ),
					impressions: safeParseFloat( item.impressions ),
					watch_time: safeParseFloat( item.watch_time ),
					retention_rate: safeParseFloat( item.retention_rate ),
					link: typeof item.url === 'string' ? item.url : null,
					children: null,
				} ) )
			);
		} ),
	};
}
