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
	time_interval?: string;
	date_start?: string;
	date_end?: string;
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
export type StatsTimeSeriesReport = StatsNormalizedReport;

type AnyRecord = Record< string, any >;

function asRecord( value: unknown ): AnyRecord {
	return value && typeof value === 'object' && ! Array.isArray( value )
		? ( value as AnyRecord )
		: {};
}

function emptyReport(): StatsNormalizedReport {
	return {
		summary: {},
		data: [],
	};
}

function asArray< T = AnyRecord >( value: unknown ): T[] {
	return Array.isArray( value ) ? ( value as T[] ) : [];
}

function decodeLabel( value: unknown ) {
	if ( typeof value !== 'string' ) {
		return value ?? '';
	}

	try {
		return decodeURIComponent( value );
	} catch {
		return value;
	}
}

function numericSummary( value: unknown ): Record< string, unknown > {
	return Object.fromEntries(
		Object.entries( asRecord( value ) ).map( ( [ key, item ] ) => [
			key,
			typeof item === 'number' || typeof item === 'string' ? safeParseFloat( item ) : item,
		] )
	);
}

function formatDatePart( date: Date ) {
	return date.toISOString().split( 'T' )[ 0 ];
}

function addDays( date: Date, days: number ) {
	const result = new Date( date );
	result.setUTCDate( result.getUTCDate() + days );
	return result;
}

function isoWeekRange( period: string ) {
	const match = period.match( /^(\d{4})-?W?(\d{1,2})$/ );

	if ( ! match ) {
		return null;
	}

	const year = Number( match[ 1 ] );
	const week = Number( match[ 2 ] );
	const fourthOfJanuary = new Date( Date.UTC( year, 0, 4 ) );
	const day = fourthOfJanuary.getUTCDay() || 7;
	const firstWeekStart = addDays( fourthOfJanuary, 1 - day );
	const start = addDays( firstWeekStart, ( week - 1 ) * 7 );
	const end = addDays( start, 6 );

	return {
		date_start: formatDatePart( start ),
		date_end: formatDatePart( end ),
	};
}

function monthRange( period: string ) {
	const match = period.match( /^(\d{4})-(\d{2})$/ );

	if ( ! match ) {
		return null;
	}

	const year = Number( match[ 1 ] );
	const month = Number( match[ 2 ] );
	const start = new Date( Date.UTC( year, month - 1, 1 ) );
	const end = new Date( Date.UTC( year, month, 0 ) );

	return {
		date_start: formatDatePart( start ),
		date_end: formatDatePart( end ),
	};
}

function yearRange( period: string ) {
	const match = period.match( /^(\d{4})$/ );

	if ( ! match ) {
		return null;
	}

	const year = Number( match[ 1 ] );

	return {
		date_start: `${ year }-01-01`,
		date_end: `${ year }-12-31`,
	};
}

function getChartPeriodRange( unit: string, period: unknown ) {
	const periodString = typeof period === 'string' ? period : '';

	if ( ! periodString ) {
		return {
			date_start: '',
			date_end: '',
		};
	}

	if ( unit === 'week' ) {
		return isoWeekRange( periodString ) ?? { date_start: periodString, date_end: periodString };
	}

	if ( unit === 'month' ) {
		return monthRange( periodString ) ?? { date_start: periodString, date_end: periodString };
	}

	if ( unit === 'year' ) {
		return yearRange( periodString ) ?? { date_start: periodString, date_end: periodString };
	}

	return {
		date_start: periodString,
		date_end: periodString,
	};
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

function parseChartData( payload: unknown ) {
	const response = asRecord( payload );
	const fields = asArray< string >( response.fields );

	if ( ! fields.length ) {
		return [];
	}

	return asArray< unknown[] >( response.data ).map( record => {
		const parsed: Record< string, unknown > = {};
		record.forEach( ( value, index ) => {
			const field = fields[ index ];
			if ( field ) {
				parsed[ field ] =
					[ 'period', 'time_interval', 'date', 'date_start', 'date_end' ].includes( field ) ||
					! ( typeof value === 'number' || typeof value === 'string' )
						? value
						: safeParseFloat( value );
			}
		} );
		return parsed;
	} );
}

function numericTimeSeriesRow( row: AnyRecord ) {
	return Object.fromEntries(
		Object.entries( row ).map( ( [ key, value ] ) => [
			key,
			key === 'period' ||
			key === 'time_interval' ||
			key === 'date' ||
			key === 'date_start' ||
			key === 'date_end' ||
			! ( typeof value === 'number' || typeof value === 'string' )
				? value
				: safeParseFloat( value ),
		] )
	);
}

function parseTimeSeriesRows( payload: unknown ) {
	const response = asRecord( payload );
	const timeline = asRecord( response.timeline );
	const chartRows = parseChartData( Object.keys( timeline ).length ? timeline : response );

	if ( chartRows.length ) {
		return chartRows;
	}

	const data = asArray< AnyRecord >( response.data );

	if ( data.length ) {
		return data.map( numericTimeSeriesRow );
	}

	return Object.entries( asRecord( response.days ) ).map( ( [ period, value ] ) => {
		if ( typeof value === 'number' || typeof value === 'string' ) {
			return numericTimeSeriesRow( { period, value } );
		}

		return numericTimeSeriesRow( { period, ...asRecord( value ) } );
	} );
}

function isTimeSeriesPayload( payload: unknown ) {
	const response = asRecord( payload );

	if ( asArray( response.fields ).length || Object.keys( asRecord( response.days ) ).length ) {
		return true;
	}

	const firstRow = asRecord( asArray< AnyRecord >( response.data )[ 0 ] );

	return Boolean(
		firstRow.period || firstRow.time_interval || firstRow.date || firstRow.date_start
	);
}

function parseUtmLabelParts( key: string ) {
	if ( ! key.startsWith( '[' ) ) {
		return [ key ];
	}

	try {
		const parsed = JSON.parse( key );
		return asArray< string >( parsed );
	} catch {
		return [ key ];
	}
}

function getPrimaryMetricValue( row: AnyRecord ) {
	const primaryMetric = Object.entries( row ).find(
		( [ key, value ] ) =>
			! [ 'period', 'time_interval', 'date', 'date_start', 'date_end' ].includes( key ) &&
			typeof value === 'number'
	);

	return primaryMetric?.[ 1 ] ?? 0;
}

function getTimeSeriesSummarySidecars( response: AnyRecord ) {
	return {
		...numericSummary( response.summary ),
		...numericSummary( response.opens_rate ),
		...numericSummary( response.clicks_rate ),
		...numericSummary( response.rate ),
	};
}

export function sanitizeStatsTimeSeriesResponse(
	payload: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const response = asRecord( payload );
	const timeline = asRecord( response.timeline );
	const unit = String( timeline.unit ?? response.unit ?? query?.unit ?? query?.period ?? 'day' );
	const rows = parseTimeSeriesRows( payload );
	const summary = rows.reduce< Record< string, number > >( ( totals, row ) => {
		Object.entries( row ).forEach( ( [ key, value ] ) => {
			if (
				! [ 'period', 'time_interval', 'date', 'date_start', 'date_end' ].includes( key ) &&
				typeof value === 'number'
			) {
				totals[ key ] = ( totals[ key ] ?? 0 ) + safeParseFloat( value );
			}
		} );
		return totals;
	}, {} );
	const normalizedRows = rows.map( row => {
		const period = row.period ?? row.time_interval ?? row.date_start ?? row.date;
		const range =
			row.date_start && row.date_end
				? { date_start: String( row.date_start ), date_end: String( row.date_end ) }
				: getChartPeriodRange( unit, period );
		const value = safeParseFloat( getPrimaryMetricValue( row ) );

		return {
			...row,
			time_interval: range.date_start,
			date_start: range.date_start,
			date_end: range.date_end,
			label: range.date_start,
			value,
		};
	} );
	const firstRow = normalizedRows[ 0 ];
	const lastRow = normalizedRows[ normalizedRows.length - 1 ];

	return {
		summary: {
			...getTimeSeriesSummarySidecars( response ),
			...summary,
			date_start: firstRow?.date_start ?? query?.start_date ?? '',
			date_end: lastRow?.date_end ?? query?.date ?? '',
		},
		data: normalizedRows as StatsNormalizedItem[],
	};
}

export function sanitizeStatsArchivesResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const bucket = getStatsBucket( response, query );

	if ( Array.isArray( bucket ) ) {
		return emptyReport();
	}

	const rows = Object.entries( bucket ).reduce< StatsNormalizedItem[] >(
		( normalizedRows, [ archiveType, archiveItems ] ) => {
			if ( archiveType === 'tax' ) {
				const children = Object.entries( asRecord( archiveItems ) )
					.map( ( [ taxonomy, terms ] ) => {
						const termRows = asArray< AnyRecord >( terms ).map( term => ( {
							label: decodeLabel( term.value ),
							value: safeParseFloat( term.views ),
							link: term.href,
							children: null,
						} ) );
						const value = termRows.reduce( ( total, term ) => total + term.value, 0 );

						return {
							label: taxonomy,
							value,
							children: termRows,
						};
					} )
					.filter( item => item.value > 0 );
				const value = children.reduce( ( total, item ) => total + item.value, 0 );

				if ( children.length ) {
					normalizedRows.push( {
						label: archiveType,
						value,
						children,
					} );
				}

				return normalizedRows;
			}

			const children = asArray< AnyRecord >( archiveItems )
				.filter( item => item.value )
				.map( item => ( {
					label: archiveType === 'home' ? item.href : decodeLabel( item.value ),
					value: safeParseFloat( item.views ),
					link: item.href,
					children: null,
				} ) );
			const value = children.reduce( ( total, item ) => total + item.value, 0 );

			if ( children.length ) {
				normalizedRows.push( {
					label: archiveType,
					value,
					children: archiveType === 'home' && children.length < 2 ? null : children,
				} );
			}

			return normalizedRows;
		},
		[]
	);

	return {
		summary: numericSummary( {
			total: rows.reduce( ( total, row ) => total + row.value, 0 ),
		} ),
		data: rows.sort( ( a, b ) => b.value - a.value ),
	};
}

export function sanitizeStatsPublicizeResponse( response: unknown ): StatsNormalizedReport {
	const services = asArray< AnyRecord >( asRecord( response ).services );

	return {
		summary: numericSummary( {
			total: services.reduce(
				( total, service ) => total + safeParseFloat( service.followers ),
				0
			),
		} ),
		data: services.map( service => ( {
			...service,
			label: service.label ?? service.name ?? service.service ?? '',
			value: safeParseFloat( service.followers ),
		} ) ),
	};
}

export function sanitizeStatsFollowersResponse( response: unknown ): StatsNormalizedReport {
	const payload = asRecord( response );
	const subscribers = asArray< AnyRecord >( payload.subscribers );

	return {
		summary: numericSummary( {
			page: payload.page,
			pages: payload.pages,
			total: payload.total,
			total_email: payload.total_email,
			total_wpcom: payload.total_wpcom,
		} ),
		data: subscribers.map( item => ( {
			id: item.ID ?? item.id ?? item.subscription_id,
			label: item.label ?? item.name ?? item.email ?? '',
			value: 0,
			iconClassName: 'avatar-user',
			icon: item.avatar ?? null,
			link: item.url ?? null,
			date_subscribed: item.date_subscribed,
			subscription_id: item.subscription_id,
			actions: [
				{
					type: 'follow',
					data: item.follow_data?.params ?? false,
				},
			],
		} ) ),
	};
}

export function sanitizeStatsTagsResponse( response: unknown ): StatsNormalizedReport {
	const tags = asArray< AnyRecord >( asRecord( response ).tags );
	const tagIcon = ( type: unknown ) => ( type === 'category' ? 'folder' : String( type ?? '' ) );

	return {
		summary: numericSummary( {
			total: tags.reduce( ( total, item ) => total + safeParseFloat( item.views ), 0 ),
		} ),
		data: tags.map( item => {
			const tagItems = asArray< AnyRecord >( item.tags );
			const hasChildren = tagItems.length > 1;
			const labels = tagItems.map( tag => ( {
				label: tag.name,
				labelIcon: tagIcon( tag.type ),
				link: hasChildren ? null : tag.link,
			} ) );

			return {
				...item,
				label: labels.map( label => label.label ).join( ', ' ),
				labels,
				link: hasChildren ? null : labels[ 0 ]?.link,
				value: safeParseFloat( item.views ),
				children: hasChildren
					? tagItems.map( tag => ( {
							label: tag.name,
							labelIcon: tagIcon( tag.type ),
							value: 0,
							link: tag.link,
							children: null,
					  } ) )
					: null,
			};
		} ),
	};
}

export function sanitizeStatsCommentsResponse( response: unknown ): StatsNormalizedReport {
	const payload = asRecord( response );
	const authors = asArray< AnyRecord >( payload.authors ).map( author => ( {
		label: author.name,
		value: safeParseFloat( author.comments ),
		iconClassName: 'avatar-user',
		icon: author.gravatar ?? null,
		link: author.link ?? null,
		className: 'module-content-list-item-large',
		actions: [
			{
				type: 'follow',
				data: author.follow_data?.params ?? false,
			},
		],
	} ) );
	const posts = asArray< AnyRecord >( payload.posts ).map( post => ( {
		id: post.id,
		label: post.name ?? post.title ?? '',
		value: safeParseFloat( post.comments ),
		link: post.link ?? null,
		page: post.id ? `/stats/post/${ post.id }` : null,
		actions: post.link ? [ { type: 'link', data: post.link } ] : [],
	} ) );

	return {
		summary: numericSummary( {
			total_comments: payload.total_comments,
			most_active_day: payload.most_active_day,
			most_active_time: payload.most_active_time,
			monthly_comments: payload.monthly_comments,
		} ),
		data: [
			{
				label: 'authors',
				value: authors.reduce( ( total, author ) => total + author.value, 0 ),
				children: authors,
			},
			{
				label: 'posts',
				value: posts.reduce( ( total, post ) => total + post.value, 0 ),
				children: posts,
			},
		].filter( item => item.children.length ),
	};
}

export function sanitizeStatsCommentFollowersResponse( response: unknown ): StatsNormalizedReport {
	const payload = asRecord( response );
	const posts = asArray< AnyRecord >( payload.posts );

	return {
		summary: numericSummary( {
			page: payload.page,
			pages: payload.pages,
			total: payload.total,
		} ),
		data: posts.map( item => ( {
			id: item.id,
			label: item.id === 0 ? 'All Posts' : item.title,
			value: safeParseFloat( item.followers ),
			link: item.id === 0 ? null : item.url,
			labelIcon: item.id === 0 ? undefined : 'external',
			children: null,
		} ) ),
	};
}

export function sanitizeStatsEmailSummaryResponse( response: unknown ): StatsNormalizedReport {
	const posts = asArray< AnyRecord >( asRecord( response ).posts );

	return {
		summary: numericSummary( {
			total_sends: posts.reduce( ( total, post ) => total + safeParseFloat( post.total_sends ), 0 ),
			opens: posts.reduce( ( total, post ) => total + safeParseFloat( post.opens ), 0 ),
			clicks: posts.reduce( ( total, post ) => total + safeParseFloat( post.clicks ), 0 ),
			unique_opens: posts.reduce(
				( total, post ) => total + safeParseFloat( post.unique_opens ),
				0
			),
			unique_clicks: posts.reduce(
				( total, post ) => total + safeParseFloat( post.unique_clicks ),
				0
			),
		} ),
		data: posts.map( post => ( {
			id: post.id,
			label: post.title,
			value: safeParseFloat( post.opens ),
			link: post.href,
			date: post.date,
			type: post.type,
			opens: safeParseFloat( post.opens ),
			clicks: safeParseFloat( post.clicks ),
			opens_rate: safeParseFloat( post.opens_rate ),
			clicks_rate: safeParseFloat( post.clicks_rate ),
			unique_opens: safeParseFloat( post.unique_opens ),
			unique_clicks: safeParseFloat( post.unique_clicks ),
			total_sends: safeParseFloat( post.total_sends ),
			children: null,
		} ) ),
	};
}

export function sanitizeStatsEmailBreakdownResponse( response: unknown ): StatsNormalizedReport {
	const payload = asRecord( response );
	const matrixKey = [ 'clients', 'devices', 'countries', 'links', 'user-content-links' ].find(
		key => asArray( asRecord( payload[ key ] ).fields ).length
	);

	if ( ! matrixKey ) {
		return {
			summary: numericSummary( payload ),
			data: [],
		};
	}

	const matrix = asRecord( payload[ matrixKey ] );
	const fields = asArray< string >( matrix.fields );
	const labelKey = fields[ 0 ] ?? 'label';
	const metricKey = fields.find( field => field.endsWith( '_count' ) ) ?? fields[ 1 ] ?? 'value';
	const countryInfo = asRecord( payload[ 'countries-info' ] );
	const rows = asArray< unknown[] >( matrix.data ).map( record => {
		const parsed: AnyRecord = {};
		record.forEach( ( value, index ) => {
			const field = fields[ index ];
			if ( field ) {
				parsed[ field ] =
					field === labelKey || ! ( typeof value === 'number' || typeof value === 'string' )
						? value
						: safeParseFloat( value );
			}
		} );

		const country = asRecord( countryInfo[ parsed[ labelKey ] ] );
		const label =
			matrixKey === 'countries' ? country.country_full ?? parsed[ labelKey ] : parsed[ labelKey ];

		return {
			...parsed,
			label,
			value: safeParseFloat( parsed[ metricKey ] ),
			countryCode: matrixKey === 'countries' ? String( parsed[ labelKey ] ) : undefined,
			countryFull: country.country_full,
			children: null,
		};
	} );

	return {
		summary: numericSummary( {
			[ metricKey ]: rows.reduce( ( total, row ) => total + row.value, 0 ),
		} ),
		data: rows,
	};
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

	return {
		summary: numericSummary( {
			total: views.reduce( ( total, item ) => total + safeParseFloat( item.views ), 0 ),
		} ),
		data: views
			.filter( item => ! [ 'A1', 'A2', 'ZZ' ].includes( item.country_code ) )
			.map( item => {
				const country = asRecord( countryInfo[ item.country_code ] );
				const label = item.location ?? country.country_full ?? item.country_code ?? '';

				return {
					label: typeof label === 'string' ? label.replace( /’/, "'" ) : label,
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

export function sanitizeStatsUtmResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	if ( isTimeSeriesPayload( response ) ) {
		return sanitizeStatsTimeSeriesResponse( response, query );
	}

	const payload = asRecord( response );
	const topUtmValues = asRecord( payload.top_utm_values );

	if ( Object.keys( topUtmValues ).length ) {
		const topPosts = asRecord( payload.top_posts );
		const rows = Object.entries( topUtmValues ).map( ( [ key, value ] ) => {
			const parsedKey = parseUtmLabelParts( key );

			return {
				label: parsedKey.join( ' / ' ),
				value: safeParseFloat( value ),
				children: asArray< AnyRecord >( topPosts[ key ] ).map( post => ( {
					id: post.id,
					label: post.title,
					value: safeParseFloat( post.views ),
					link: post.href,
					page: post.id ? `/stats/post/${ post.id }` : null,
					children: null,
				} ) ),
			};
		} );

		return {
			summary: numericSummary( {
				total: rows.reduce( ( total, item ) => total + item.value, 0 ),
			} ),
			data: rows,
		};
	}

	const rows: AnyRecord[] = [];

	asArray< AnyRecord >( response ).forEach( row => {
		rows.push( row );
		asArray< AnyRecord >( row.children ).forEach( child =>
			rows.push( { ...child, context: row.label } )
		);
	} );

	return {
		summary: numericSummary( {
			total: rows.reduce( ( total, item ) => total + safeParseFloat( item.value ), 0 ),
		} ),
		data: rows.map( row => ( {
			label: row.context ? `${ row.context } > ${ row.label }` : row.label,
			value: safeParseFloat( row.value ),
			children: null,
		} ) ),
	};
}

export function sanitizeStatsDevicesResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const payload = asRecord( response );
	const topValues = asRecord( payload.top_values );

	if ( Object.keys( topValues ).length ) {
		const rows = Object.entries( topValues ).map( ( [ key, value ] ) => ( {
			key,
			label: key,
			value: safeParseFloat( value ),
		} ) );

		return {
			summary: numericSummary( {
				total: rows.reduce( ( total, item ) => total + item.value, 0 ),
			} ),
			data: rows,
		};
	}

	if ( Array.isArray( response ) ) {
		return {
			summary: numericSummary( {
				total: response.reduce(
					( total, item ) => total + safeParseFloat( asRecord( item ).value ),
					0
				),
			} ),
			data: response.map( item => {
				const record = asRecord( item );

				return {
					...record,
					label: record.label ?? record.name ?? '',
					value: safeParseFloat( record.value ?? record.views ),
				};
			} ),
		};
	}

	return sanitizeStatsTimeSeriesResponse( response, query );
}

export function sanitizeStatsVisitsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	return sanitizeStatsTimeSeriesResponse( response, query );
}

export function sanitizeStatsGenericListResponse(
	response: unknown,
	valueKey = 'views',
	labelKey = 'label'
): StatsNormalizedReport {
	const payload = asRecord( response );
	const items = Array.isArray( response )
		? asArray< AnyRecord >( response )
		: [
				payload.data,
				payload.items,
				payload.summary,
				payload.services,
				payload.subscribers,
				payload.posts,
		  ]
				.map( asArray< AnyRecord > )
				.find( candidates => candidates.length ) ?? [];

	if ( items.length ) {
		return {
			summary: numericSummary( {
				total: items.reduce(
					( total, item ) => total + safeParseFloat( item[ valueKey ] ?? item.value ),
					0
				),
			} ),
			data: items.map( item => ( {
				...item,
				label: item[ labelKey ] ?? item.name ?? item.title ?? item.term ?? '',
				value: safeParseFloat( item[ valueKey ] ?? item.value ),
			} ) ),
		};
	}

	return emptyReport();
}

export function sanitizeStatsPassthroughResponse< T >( response: T ): T {
	return response;
}
