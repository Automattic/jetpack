/**
 * Internal dependencies
 */
import { safeParseFloat } from '../../utils/parsing';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsItemAction = {
	type: string;
	data: unknown;
};

export type StatsNormalizedItemMeta = {
	link?: string | null;
	page?: string | null;
	shortLabel?: string;
	labelIcon?: string | null;
	icon?: string | null;
	iconClassName?: string;
	className?: string | null;
	countryCode?: string;
	countryFull?: string;
	region?: string;
	coordinates?: unknown;
	actions?: StatsItemAction[];
	actionMenu?: number;
	[ key: string ]: unknown;
};

export type StatsNormalizedItem = {
	id?: string | number;
	label: unknown;
	value: number;
	children?: StatsNormalizedItem[] | null;
	meta?: StatsNormalizedItemMeta;
};

export type StatsNormalizedReport = {
	summary: Record< string, number >;
	data: StatsNormalizedItem[];
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

function normalizeNumericSummary( value: StatsRecord ): Record< string, number > {
	return Object.fromEntries(
		Object.entries( value ).map( ( [ key, item ] ) => [ key, safeParseFloat( item ) ] )
	);
}

function countTotalByKey( items: StatsRecord[], key: string ): number {
	return items.reduce( ( total, item ) => total + safeParseFloat( item[ key ] ), 0 );
}

function countTotalByFirstAvailableKey( items: StatsRecord[], keys: string[] ): number {
	return items.reduce( ( total, item ) => {
		const key = keys.find( candidate => item[ candidate ] !== undefined );

		return key ? total + safeParseFloat( item[ key ] ) : total;
	}, 0 );
}

function getFirstDayBucket( response: StatsRecord ) {
	const days = getStatsRecord( response.days );
	const firstKey = Object.keys( days )[ 0 ];

	return firstKey ? getStatsRecord( days[ firstKey ] ) : {};
}

function getStatsBucket( response: unknown, query: StatsQueryParams = {} ) {
	const payload = getStatsRecord( response );
	const summary = getStatsRecord( payload.summary );

	if ( query.summarize && Object.keys( summary ).length ) {
		return summary;
	}

	const days = getStatsRecord( payload.days );
	const requested = query.date ?? query.start_date;

	if ( requested && days[ requested ] ) {
		return getStatsRecord( days[ requested ] );
	}

	return getFirstDayBucket( payload );
}

function getStatsItems(
	response: unknown,
	query: StatsQueryParams | undefined,
	bucket: StatsRecord,
	key: string
): StatsRecord[] {
	const source = query?.summarize ? getStatsRecord( getStatsRecord( response ).summary ) : bucket;

	return getStatsArray< StatsRecord >( source[ key ] );
}

function mapNestedItems(
	items: StatsRecord[],
	mapper: ( item: StatsRecord ) => StatsNormalizedItem
) {
	return items.map( item => mapper( item ) );
}

export function sanitizeStatsPassthroughResponse< T >( response: T ): T {
	return response;
}

export function sanitizeStatsSiteResponse( response: unknown ) {
	const payload = getStatsRecord( response );

	return {
		...payload,
		stats: normalizeNumericSummary( getStatsRecord( payload.stats ) ),
	};
}

export function sanitizeStatsTopPostsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const bucket = getStatsBucket( response, query );
	const items = getStatsItems( response, query, bucket, 'postviews' );

	return {
		summary: normalizeNumericSummary( {
			total_views:
				bucket.total_views ?? getStatsRecord( getStatsRecord( response ).summary ).total_views,
		} ),
		data: items.map( item => ( {
			id: item.id as string | number | undefined,
			label: item.title,
			value: safeParseFloat( item.views ),
			children: null,
			meta: {
				link: typeof item.href === 'string' ? item.href : null,
				page: item.id ? `/stats/post/${ item.id }` : null,
				public: item.public,
				type: item.type,
				actions: item.href ? [ { type: 'link', data: item.href } ] : [],
			},
		} ) ),
	};
}

export function sanitizeStatsReferrersResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const bucket = getStatsBucket( response, query );
	const groups = getStatsItems( response, query, bucket, 'groups' );

	const parse = ( item: StatsRecord ): StatsNormalizedItem => ( {
		label: item.name ?? item.group ?? '',
		value: safeParseFloat( item.views ?? item.total ),
		children: mapNestedItems( getStatsArray( item.results ?? item.children ), parse ),
		meta: {
			link: typeof item.url === 'string' ? item.url : null,
			icon: typeof item.icon === 'string' ? item.icon : null,
			labelIcon: item.results || item.children ? null : 'external',
		},
	} );

	return {
		summary: normalizeNumericSummary( {
			total: bucket.total ?? countTotalByFirstAvailableKey( groups, [ 'total', 'views' ] ),
		} ),
		data: groups.map( item => {
			const results = getStatsArray< StatsRecord >( item.results );
			const normalized = parse( results.length === 1 ? results[ 0 ] : item );
			const domain = item.name ?? item.group;
			const canSpam = typeof domain === 'string' && domain.includes( '.' );

			return {
				...normalized,
				meta: {
					...normalized.meta,
					actions: canSpam ? [ { type: 'spam', data: { domain } } ] : [],
					actionMenu: canSpam ? 1 : 0,
				},
			};
		} ),
	};
}

export function sanitizeStatsClicksResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const bucket = getStatsBucket( response, query );
	const clicks = getStatsItems( response, query, bucket, 'clicks' );

	const parse = ( item: StatsRecord ): StatsNormalizedItem => ( {
		label: item.name ?? '',
		value: safeParseFloat( item.views ),
		children: mapNestedItems( getStatsArray( item.children ), child => ( {
			label:
				typeof child.name === 'string' && typeof item.name === 'string'
					? child.name.split( item.name ).join( '' ) || '/'
					: '/',
			value: safeParseFloat( child.views ),
			children: null,
			meta: {
				link: typeof child.url === 'string' ? child.url : null,
				labelIcon: 'external',
			},
		} ) ),
		meta: {
			link: typeof item.url === 'string' ? item.url : null,
			icon: typeof item.icon === 'string' ? item.icon : null,
			labelIcon: getStatsArray( item.children ).length ? null : 'external',
		},
	} );

	return {
		summary: normalizeNumericSummary( {
			total: countTotalByKey( clicks, 'views' ),
		} ),
		data: clicks.map( parse ),
	};
}

export function sanitizeStatsSearchTermsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const bucket = getStatsBucket( response, query );
	const terms = getStatsItems( response, query, bucket, 'search_terms' );

	return {
		summary: normalizeNumericSummary( {
			total: countTotalByKey( terms, 'views' ),
		} ),
		data: terms.map( item => ( {
			label: item.term,
			value: safeParseFloat( item.views ),
			children: null,
			meta: {
				className: 'user-selectable',
			},
		} ) ),
	};
}

export function sanitizeStatsFileDownloadsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const bucket = getStatsBucket( response, query );
	const files = getStatsItems( response, query, bucket, 'files' );

	return {
		summary: normalizeNumericSummary( {
			total: countTotalByKey( files, 'downloads' ),
		} ),
		data: files.map( item => ( {
			label: item.relative_url,
			value: safeParseFloat( item.downloads ),
			children: null,
			meta: {
				shortLabel: typeof item.filename === 'string' ? item.filename : undefined,
				link: typeof item.download_url === 'string' ? item.download_url : undefined,
				linkTitle: item.relative_url,
				labelIcon: 'external',
			},
		} ) ),
	};
}

export function sanitizeStatsTopAuthorsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const bucket = getStatsBucket( response, query );
	const authors = getStatsItems( response, query, bucket, 'authors' );

	return {
		summary: normalizeNumericSummary( {
			total: countTotalByKey( authors, 'views' ),
		} ),
		data: authors.map( item => ( {
			label: item.name || 'Untracked Authors',
			value: safeParseFloat( item.views ),
			children: mapNestedItems( getStatsArray( item.posts ), post => ( {
				id: post.id as string | number | undefined,
				label: post.title,
				value: safeParseFloat( post.views ),
				children: null,
				meta: {
					link: typeof post.url === 'string' ? post.url : null,
					page: post.id ? `/stats/post/${ post.id }` : null,
				},
			} ) ),
			meta: {
				icon: typeof item.avatar === 'string' ? item.avatar : null,
				iconClassName: 'avatar-user',
				className: 'module-content-list-item-large',
			},
		} ) ),
	};
}

export function sanitizeStatsLocationsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const payload = getStatsRecord( response );
	const bucket = getStatsBucket( response, query );
	const views = getStatsItems( response, query, bucket, 'views' );
	const countryInfo = getStatsRecord( payload[ 'country-info' ] ?? payload.countryInfo );
	const filteredViews = views.filter(
		item =>
			typeof item.country_code !== 'string' || ! [ 'A1', 'A2', 'ZZ' ].includes( item.country_code )
	);

	return {
		summary: normalizeNumericSummary( {
			total: countTotalByKey( filteredViews, 'views' ),
		} ),
		data: filteredViews.map( item => {
			const country = getStatsRecord(
				typeof item.country_code === 'string' ? countryInfo[ item.country_code ] : undefined
			);
			const label = item.location ?? country.country_full ?? item.country_code ?? '';

			return {
				label: typeof label === 'string' ? label.replace( /’/g, "'" ) : label,
				value: safeParseFloat( item.views ),
				children: null,
				meta: {
					countryCode: typeof item.country_code === 'string' ? item.country_code : undefined,
					countryFull: typeof country.country_full === 'string' ? country.country_full : undefined,
					region: typeof country.map_region === 'string' ? country.map_region : undefined,
					coordinates: item.coordinates,
				},
			};
		} ),
	};
}

export function sanitizeStatsVideoPlaysResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const bucket = getStatsBucket( response, query );
	const payload = getStatsRecord( response );
	const summaryDay = getStatsRecord( getStatsRecord( payload.days ).summary );
	const videoData = query?.complete_stats
		? getStatsArray< StatsRecord >( bucket.data ?? summaryDay.data )
		: getStatsArray< StatsRecord >( bucket.plays ?? summaryDay.plays );

	return {
		summary: normalizeNumericSummary( {
			total: videoData.reduce(
				( total, item ) => total + safeParseFloat( item.views ?? item.plays ),
				0
			),
		} ),
		data: videoData.map( item => ( {
			id: item.post_id as string | number | undefined,
			label: item.title,
			value: safeParseFloat( item.views ?? item.plays ),
			children: null,
			meta: {
				link: typeof item.url === 'string' ? item.url : null,
				impressions: safeParseFloat( item.impressions ),
				watch_time: safeParseFloat( item.watch_time ),
				retention_rate: safeParseFloat( item.retention_rate ),
			},
		} ) ),
	};
}
