/**
 * Internal dependencies
 */
import { safeParseFloat } from '../../utils/parsing';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsItemAction = {
	type: string;
	data: unknown;
};

export type StatsNormalizedItem = {
	id?: string | number;
	label: unknown;
	value: number;
	children?: StatsNormalizedItem[] | null;
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

export type StatsNormalizedReport = {
	summary: Record< string, unknown >;
	data: StatsNormalizedItem[];
};

type AnyRecord = Record< string, any >;

function asRecord( value: unknown ): AnyRecord {
	return value && typeof value === 'object' && ! Array.isArray( value )
		? ( value as AnyRecord )
		: {};
}

function asArray< T = AnyRecord >( value: unknown ): T[] {
	return Array.isArray( value ) ? ( value as T[] ) : [];
}

function numericSummary( value: unknown ): Record< string, unknown > {
	return Object.fromEntries(
		Object.entries( asRecord( value ) ).map( ( [ key, item ] ) => [
			key,
			typeof item === 'number' || typeof item === 'string' ? safeParseFloat( item ) : item,
		] )
	);
}

function getFirstDayBucket( response: AnyRecord ) {
	const days = asRecord( response.days );
	const firstKey = Object.keys( days )[ 0 ];

	return firstKey ? asRecord( days[ firstKey ] ) : {};
}

function getStatsBucket( response: unknown, query: StatsQueryParams = {} ) {
	const payload = asRecord( response );
	const summary = asRecord( payload.summary );

	if ( query.summarize && Object.keys( summary ).length ) {
		return summary;
	}

	const days = asRecord( payload.days );
	const requested = query.date ?? query.start_date;

	if ( requested && days[ requested ] ) {
		return asRecord( days[ requested ] );
	}

	return getFirstDayBucket( payload );
}

function mapNestedItems( items: AnyRecord[], mapper: ( item: AnyRecord ) => StatsNormalizedItem ) {
	return items.map( item => mapper( item ) );
}

export function sanitizeStatsPassthroughResponse< T >( response: T ): T {
	return response;
}

export function sanitizeStatsSiteResponse( response: unknown ) {
	const payload = asRecord( response );

	return {
		...payload,
		stats: numericSummary( payload.stats ),
	};
}

export function sanitizeStatsTopPostsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const bucket = getStatsBucket( response, query );
	const items = query?.summarize
		? asArray< AnyRecord >( asRecord( response ).summary?.postviews )
		: asArray< AnyRecord >( bucket.postviews );

	return {
		summary: numericSummary( {
			total_views: bucket.total_views ?? asRecord( response ).summary?.total_views,
		} ),
		data: items.map( item => ( {
			id: item.id,
			label: item.title,
			value: safeParseFloat( item.views ),
			link: item.href ?? null,
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
): StatsNormalizedReport {
	const bucket = getStatsBucket( response, query );
	const groups = query?.summarize
		? asArray< AnyRecord >( asRecord( response ).summary?.groups )
		: asArray< AnyRecord >( bucket.groups );

	const parse = ( item: AnyRecord ): StatsNormalizedItem => ( {
		label: item.name ?? item.group ?? '',
		value: safeParseFloat( item.views ?? item.total ),
		link: item.url ?? null,
		icon: item.icon,
		labelIcon: item.results || item.children ? null : 'external',
		children: mapNestedItems( asArray( item.results ?? item.children ), parse ),
	} );

	return {
		summary: numericSummary( {
			total:
				bucket.total ??
				groups.reduce( ( total, item ) => total + safeParseFloat( item.total ?? item.views ), 0 ),
		} ),
		data: groups.map( item => {
			const normalized = parse( item.results?.length === 1 ? item.results[ 0 ] : item );
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
): StatsNormalizedReport {
	const bucket = getStatsBucket( response, query );
	const clicks = query?.summarize
		? asArray< AnyRecord >( asRecord( response ).summary?.clicks )
		: asArray< AnyRecord >( bucket.clicks );

	const parse = ( item: AnyRecord ): StatsNormalizedItem => ( {
		label: item.name ?? '',
		value: safeParseFloat( item.views ),
		link: item.url ?? null,
		icon: item.icon,
		labelIcon: item.children?.length ? null : 'external',
		children: mapNestedItems( asArray( item.children ), child => ( {
			label: child.name?.replace?.( item.name, '' ) || '/',
			value: safeParseFloat( child.views ),
			link: child.url ?? null,
			labelIcon: 'external',
			children: null,
		} ) ),
	} );

	return {
		summary: numericSummary( {
			total: clicks.reduce( ( total, item ) => total + safeParseFloat( item.views ), 0 ),
		} ),
		data: clicks.map( parse ),
	};
}

export function sanitizeStatsSearchTermsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const bucket = getStatsBucket( response, query );
	const terms = query?.summarize
		? asArray< AnyRecord >( asRecord( response ).summary?.search_terms )
		: asArray< AnyRecord >( bucket.search_terms );

	return {
		summary: numericSummary( {
			total: terms.reduce( ( total, item ) => total + safeParseFloat( item.views ), 0 ),
		} ),
		data: terms.map( item => ( {
			label: item.term,
			value: safeParseFloat( item.views ),
			className: 'user-selectable',
			children: null,
		} ) ),
	};
}

export function sanitizeStatsFileDownloadsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const bucket = getStatsBucket( response, query );
	const files = query?.summarize
		? asArray< AnyRecord >( asRecord( response ).summary?.files )
		: asArray< AnyRecord >( bucket.files );

	return {
		summary: numericSummary( {
			total: files.reduce( ( total, item ) => total + safeParseFloat( item.downloads ), 0 ),
		} ),
		data: files.map( item => ( {
			label: item.relative_url,
			shortLabel: item.filename,
			value: safeParseFloat( item.downloads ),
			link: item.download_url,
			linkTitle: item.relative_url,
			labelIcon: 'external',
			children: null,
		} ) ),
	};
}

export function sanitizeStatsTopAuthorsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const bucket = getStatsBucket( response, query );
	const authors = query?.summarize
		? asArray< AnyRecord >( asRecord( response ).summary?.authors )
		: asArray< AnyRecord >( bucket.authors );

	return {
		summary: numericSummary( {
			total: authors.reduce( ( total, item ) => total + safeParseFloat( item.views ), 0 ),
		} ),
		data: authors.map( item => ( {
			label: item.name || 'Untracked Authors',
			value: safeParseFloat( item.views ),
			icon: item.avatar,
			iconClassName: 'avatar-user',
			className: 'module-content-list-item-large',
			children: asArray< AnyRecord >( item.posts ).map( post => ( {
				id: post.id,
				label: post.title,
				value: safeParseFloat( post.views ),
				link: post.url ?? null,
				page: post.id ? `/stats/post/${ post.id }` : null,
				children: null,
			} ) ),
		} ) ),
	};
}

export function sanitizeStatsLocationsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const payload = asRecord( response );
	const bucket = getStatsBucket( response, query );
	const views = query?.summarize
		? asArray< AnyRecord >( payload.summary?.views )
		: asArray< AnyRecord >( bucket.views );
	const countryInfo = asRecord( payload[ 'country-info' ] ?? payload.countryInfo );
	const filteredViews = views.filter(
		item => ! [ 'A1', 'A2', 'ZZ' ].includes( item.country_code )
	);

	return {
		summary: numericSummary( {
			total: filteredViews.reduce( ( total, item ) => total + safeParseFloat( item.views ), 0 ),
		} ),
		data: filteredViews.map( item => {
			const country = asRecord( countryInfo[ item.country_code ] );
			const label = item.location ?? country.country_full ?? item.country_code ?? '';

			return {
				label: typeof label === 'string' ? label.replace( /’/g, "'" ) : label,
				value: safeParseFloat( item.views ),
				countryCode: item.country_code,
				countryFull: country.country_full,
				region: country.map_region,
				coordinates: item.coordinates,
				children: null,
			};
		} ),
	};
}

export function sanitizeStatsVideoPlaysResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const bucket = getStatsBucket( response, query );
	const payload = asRecord( response );
	const videoData = query?.complete_stats
		? asArray< AnyRecord >( bucket.data ?? payload.days?.summary?.data )
		: asArray< AnyRecord >( bucket.plays ?? payload.days?.summary?.plays );

	return {
		summary: numericSummary( {
			total: videoData.reduce(
				( total, item ) => total + safeParseFloat( item.views ?? item.plays ),
				0
			),
		} ),
		data: videoData.map( item => ( {
			id: item.post_id,
			label: item.title,
			value: safeParseFloat( item.views ?? item.plays ),
			link: item.url ?? null,
			impressions: safeParseFloat( item.impressions ),
			watch_time: safeParseFloat( item.watch_time ),
			retention_rate: safeParseFloat( item.retention_rate ),
			children: null,
		} ) ),
	};
}
