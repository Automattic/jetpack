import { getCurrencyObject } from '@automattic/number-formatters';
import { InfiniteData } from '@tanstack/react-query';
import { __, _x } from '@wordpress/i18n';
import moment from 'moment';
import config from '../../compat/config';
import { SiteDetails } from '../../compat/state';
import {
	BlazablePost,
	BlazePagedItem,
	Campaign,
	CampaignQueryResult,
	PostQueryResult,
} from '../../data/promote-post/types';
import { PagedBlazeContentData } from '../main';

export const campaignStatus = {
	SCHEDULED: 'scheduled',
	CREATED: 'created',
	REJECTED: 'rejected',
	APPROVED: 'approved',
	ACTIVE: 'active',
	CANCELED: 'canceled',
	FINISHED: 'finished',
	PROCESSING: 'processing',
	SUSPENDED: 'suspended',
};

export const paymentStatus = {
	COMPLETED: 'COMPLETED',
	FAILED: 'FAILED',
	PENDING: 'PENDING',
	ON_HOLD: 'ON-HOLD',
	REFUNDED: 'REFUNDED',
	CANCELED: 'CANCELED',
};

export const getPostType = ( type: string ) => {
	switch ( type ) {
		case 'post': {
			return __( 'Post', 'jetpack-blaze' );
		}
		case 'page': {
			return __( 'Page', 'jetpack-blaze' );
		}
		case 'product': {
			return __( 'Product', 'jetpack-blaze' );
		}
		default:
			return type;
	}
};

export const getWidgetParams = ( keyValue: string ) => {
	const postPartial = keyValue?.split( '_' )[ 0 ];
	const campaignPartial = keyValue?.split( '_' )[ 1 ];
	const selectedPostId = postPartial?.split( '-' )[ 1 ] || '';
	const selectedCampaignId = campaignPartial?.split( '-' )[ 1 ] || '';
	return {
		selectedPostId,
		selectedCampaignId,
	};
};

export const getCampaignStatusBadgeColor = ( status?: string ) => {
	switch ( status ) {
		case campaignStatus.SCHEDULED: {
			return 'info-blue';
		}
		case campaignStatus.CREATED: {
			return 'warning';
		}
		case campaignStatus.REJECTED: {
			return 'error';
		}
		case campaignStatus.APPROVED: {
			return 'info-blue';
		}
		case campaignStatus.ACTIVE: {
			return 'info-green';
		}
		case campaignStatus.CANCELED: {
			return 'error';
		}
		case campaignStatus.FINISHED: {
			return 'info-blue';
		}
		case campaignStatus.SUSPENDED: {
			return 'error';
		}
		default:
			return 'warning';
	}
};

export const getCampaignStatus = ( status?: string ) => {
	switch ( status ) {
		case campaignStatus.SCHEDULED: {
			return __( 'Scheduled', 'jetpack-blaze' );
		}
		case campaignStatus.CREATED: {
			return __( 'In moderation', 'jetpack-blaze' );
		}
		case campaignStatus.REJECTED: {
			return __( 'Rejected', 'jetpack-blaze' );
		}
		case campaignStatus.APPROVED: {
			return __( 'Approved', 'jetpack-blaze' );
		}
		case campaignStatus.ACTIVE: {
			return __( 'Active', 'jetpack-blaze' );
		}
		case campaignStatus.CANCELED: {
			return __( 'Canceled', 'jetpack-blaze' );
		}
		case campaignStatus.FINISHED: {
			return __( 'Completed', 'jetpack-blaze' );
		}
		case campaignStatus.PROCESSING: {
			return __( 'Creating', 'jetpack-blaze' );
		}
		case campaignStatus.SUSPENDED: {
			return __( 'Suspended', 'jetpack-blaze' );
		}
		default:
			return status;
	}
};

const calculateDurationDays = ( start: Date, end: Date ) => {
	const diffTime = end.getTime() - start.getTime();
	return diffTime < 0 ? 0 : Math.round( diffTime / ( 1000 * 60 * 60 * 24 ) );
};

export const getCampaignDurationDays = ( start_date: string, end_date: string ) => {
	const dateStart = new Date( start_date );
	const dateEnd = new Date( end_date );
	return calculateDurationDays( dateStart, dateEnd );
};

export const getCampaignDurationFormatted = (
	start_date?: string,
	end_date?: string,
	is_evergreen = false,
	status: string = '',
	format: string = ''
) => {
	if ( ! start_date || ! end_date ) {
		return '-';
	}

	const campaignDays = getCampaignDurationDays( start_date, end_date );

	if ( campaignDays === 0 ) {
		return '-';
	}

	if ( ! format ) {
		// translators: Moment.js date format, `MMM` refers to short month name (e.g. `Sep`), `D`` refers to day of month (e.g. `5`). Wrap text [] to be displayed as is, for example `D [de] MMM` will be formatted as `5 de sep.`.
		format = _x( 'MMM D', 'shorter date format', 'jetpack-blaze' );
	}
	const dateStartFormatted = moment.utc( start_date ).format( format );

	// A campaign without an "end date", show start -> until stopped (if not ended)
	if ( is_evergreen ) {
		if ( status === 'active' ) {
			return `${ dateStartFormatted } - ${ __( 'Until stopped', 'jetpack-blaze' ) }`;
		}

		if ( status === 'scheduled' || status === 'created' ) {
			return '-';
		}
	}

	// Else show start -> end
	const dateEndFormatted = moment.utc( end_date ).format( format );
	return `${ dateStartFormatted } - ${ dateEndFormatted }`;
};

export const getCampaignStartDateFormatted = ( start_date?: string ) => {
	if ( ! start_date ) {
		return '-';
	}

	// translators: Moment.js date format. LLL: June 7, 2024 9:27 AM
	const format = _x( 'LLL', 'datetime format', 'jetpack-blaze' );
	return moment.utc( start_date ).format( format );
};

export const getCampaignActiveDays = ( start_date?: string, end_date?: string ) => {
	if ( ! start_date || ! end_date ) {
		return 0;
	}

	const now = new Date();
	const dateStart = new Date( start_date );
	let dateEnd = new Date( end_date );
	if ( dateEnd.getTime() > now.getTime() ) {
		dateEnd = now;
	}

	return calculateDurationDays( dateStart, dateEnd );
};

export const formatCents = ( amount: number, decimals?: number ) => {
	return amount.toLocaleString( undefined, {
		useGrouping: true,
		minimumFractionDigits: decimals ?? ( amount % 1 !== 0 ? 2 : 0 ),
		maximumFractionDigits: 2,
	} );
};

export const getCampaignEstimatedImpressions = ( displayDeliveryEstimate: string ) => {
	if ( ! displayDeliveryEstimate ) {
		return '-';
	}
	const [ minEstimate, maxEstimate ] = displayDeliveryEstimate.split( ':' );
	return `${ ( +minEstimate ).toLocaleString() } - ${ ( +maxEstimate ).toLocaleString() }`;
};

export const formatNumber = ( number: number, onlyPositives = false ): string => {
	if ( ! number || ( onlyPositives && number < 0 ) ) {
		return '-';
	}
	return number.toLocaleString();
};

export const canCancelCampaign = ( status: string ) => {
	return [ campaignStatus.SCHEDULED, campaignStatus.CREATED, campaignStatus.ACTIVE ].includes(
		status
	);
};

export const canPromoteAgainCampaign = ( status: string ) => {
	if ( status === campaignStatus.REJECTED ) {
		return false;
	}

	return [
		campaignStatus.SCHEDULED,
		campaignStatus.ACTIVE,
		campaignStatus.FINISHED,
		campaignStatus.CREATED,
		campaignStatus.CANCELED,
		campaignStatus.PROCESSING,
	].includes( status );
};

export const canGetCampaignStats = ( status: string ) => {
	return [ campaignStatus.ACTIVE, campaignStatus.FINISHED, campaignStatus.CANCELED ].includes(
		status
	);
};

type PagedDataMode = 'campaigns' | 'posts';

type BlazeDataPaged = {
	campaigns?: Campaign[];
	posts?: BlazablePost[];
};

export const getPagedBlazeSearchData = (
	mode: PagedDataMode,
	pagedData?: InfiniteData< CampaignQueryResult | PostQueryResult >
): PagedBlazeContentData => {
	const lastPage = pagedData?.pages?.[ pagedData?.pages?.length - 1 ];

	const campaigns_stats =
		lastPage && 'campaigns_stats' in lastPage
			? lastPage.campaigns_stats
			: {
					total_impressions: 0,
					total_clicks: 0,
				};

	if ( lastPage ) {
		const { has_more_pages, total_items, warnings, tsp_eligible = false } = lastPage;

		let foundContent: BlazePagedItem[] = pagedData?.pages
			?.map( ( item: BlazeDataPaged ) => item[ mode ] )
			?.flat()
			?.filter( ( item?: BlazePagedItem ): item is BlazePagedItem => 'undefined' !== typeof item );

		if ( foundContent?.length ) {
			switch ( mode ) {
				case 'campaigns':
					foundContent = foundContent as Campaign[];
					break;
				case 'posts':
					foundContent = foundContent as BlazablePost[];
			}
		}

		return {
			has_more_pages,
			campaigns_stats,
			total_items,
			items: foundContent,
			warnings,
			tsp_eligible,
		};
	}
	return {
		has_more_pages: false,
		total_items: 0,
		items: [],
		tsp_eligible: false,
	};
};

/**
 * Update the path by adding the advertising section URL prefix
 * @param {string} path - partial URL
 * @return pathname concatenated with the advertising configured path prefix
 */
export function getAdvertisingDashboardPath( path: string ) {
	const pathPrefix = config( 'advertising_dashboard_path_prefix' ) || '/advertising';
	return `${ pathPrefix }${ path }`;
}

export const getShortDateString = ( date: string, withTime: boolean = false ) => {
	const timestamp = moment( Date.parse( date ) );
	const now = moment();

	const minuteDiff = Math.abs( now.diff( timestamp, 'minutes' ) );
	if ( minuteDiff < 1 ) {
		return __( 'Now', 'jetpack-blaze' );
	}

	const dateDiff = Math.abs( now.diff( timestamp, 'days' ) );
	if ( dateDiff < 7 ) {
		return timestamp.fromNow();
	}

	if ( withTime ) {
		const format = timestamp.isSame( now, 'year' )
			? // translators: Moment.js date format, `MMM` refers to short month name (e.g. `Sep`), `DD`` refers to 2-digit day of month (e.g. `05`). Wrap text [] to be displayed as is, for example `DD [de] MMM` will be formatted as `05 de sep.`. HH:mm refers to 24-hour time format (e.g. `18:00`).
				_x( 'MMM DD, HH:mm', 'short date format', 'jetpack-blaze' )
			: // translators: Moment.js date format, `MMM` refers to short month name (e.g. `Sep`), `DD`` refers to 2-digit day of month (e.g. `05`), `YYYY` refers to the full year format (e.g. `2023`). Wrap text [] to be displayed as is, for example `DD [de] MMM [de] YYYY` will be formatted as `05 de sep. de 2023`. HH:mm refers to 24-hour time format (e.g. `18:00`).
				_x( 'MMM DD, YYYY HH:mm', 'short date with year format', 'jetpack-blaze' );

		return moment( date ).format( format );
	}

	const format = timestamp.isSame( now, 'year' )
		? // translators: Moment.js date format, `MMM` refers to short month name (e.g. `Sep`), `DD`` refers to 2-digit day of month (e.g. `05`). Wrap text [] to be displayed as is, for example `DD [de] MMM` will be formatted as `05 de sep.`.
			_x( 'MMM DD', 'short date format', 'jetpack-blaze' )
		: // translators: Moment.js date format, `MMM` refers to short month name (e.g. `Sep`), `DD`` refers to 2-digit day of month (e.g. `05`), `YYYY` refers to the full year format (e.g. `2023`). Wrap text [] to be displayed as is, for example `DD [de] MMM [de] YYYY` will be formatted as `05 de sep. de 2023`.
			_x( 'MMM DD, YYYY', 'short date with year format', 'jetpack-blaze' );

	return moment( date ).format( format );
};

export const formatAmount = ( amount: number, currencyCode: string ) => {
	if ( ! amount ) {
		return undefined;
	}
	const money = getCurrencyObject( amount, currencyCode, { stripZeros: false } );
	return `${ money.symbol }${ money.integer }${ money.fraction }`;
};

export const isRunningInWpAdmin = ( site: SiteDetails | null | undefined ): boolean => {
	if ( ! site ) {
		return false;
	}
	const isRunningInJetpack = config.isEnabled( 'is_running_in_jetpack_site' );
	const isRunningInClassicSimple = site?.options?.is_wpcom_simple;
	return isRunningInClassicSimple || isRunningInJetpack;
};

export const cvsStatsDownload = ( csvData: string, fileName: string = 'report.csv' ) => {
	const blob = new Blob( [ csvData ], { type: 'text/csv;charset=utf-8;' } );
	const link = document.createElement( 'a' );
	link.href = URL.createObjectURL( blob );
	link.download = fileName;
	link.click();
	URL.revokeObjectURL( link.href );
};

export type StatusBadgeIntent = 'high' | 'medium' | 'stable' | 'informational' | 'none';

const BADGE_COLOR_INTENTS: Record< string, StatusBadgeIntent > = {
	error: 'high',
	warning: 'medium',
	'info-green': 'stable',
	'info-blue': 'informational',
	info: 'none',
};

export const getCampaignStatusBadgeIntent = ( status?: string ): StatusBadgeIntent =>
	BADGE_COLOR_INTENTS[ getCampaignStatusBadgeColor( status ) ] ?? 'none';

export const getPaymentStatusBadgeIntent = ( status?: string ): StatusBadgeIntent =>
	BADGE_COLOR_INTENTS[ getPaymentStatusBadgeColor( status ) ] ?? 'none';

export const getPaymentStatusBadgeColor = ( status?: string ) => {
	switch ( status ) {
		case paymentStatus.COMPLETED: {
			return 'info-green';
		}
		case paymentStatus.FAILED: {
			return 'error';
		}
		case paymentStatus.PENDING: {
			return 'info';
		}
		case paymentStatus.ON_HOLD: {
			return 'info-blue';
		}
		case paymentStatus.REFUNDED: {
			return 'info-blue';
		}
		case paymentStatus.CANCELED: {
			return 'error';
		}
		default:
			return 'warning';
	}
};

export const getPaymentStatus = ( status?: string ) => {
	switch ( status ) {
		case paymentStatus.COMPLETED: {
			return __( 'Completed', 'jetpack-blaze' );
		}
		case paymentStatus.FAILED: {
			return __( 'Failed', 'jetpack-blaze' );
		}
		case paymentStatus.PENDING: {
			return __( 'Pending', 'jetpack-blaze' );
		}
		case paymentStatus.ON_HOLD: {
			return __( 'On hold', 'jetpack-blaze' );
		}
		case paymentStatus.REFUNDED: {
			return __( 'Refunded', 'jetpack-blaze' );
		}
		case paymentStatus.CANCELED: {
			return __( 'Canceled', 'jetpack-blaze' );
		}
		default:
			return status;
	}
};

export type CreditExpirationInfo = {
	hasExpiringCredits: boolean;
	sortedHistory: Array< { amount: number; expires: string } >;
};

/**
 * Check if any credits expire within a month and return sorted history
 * @param history
 */
export const getCreditExpirationInfo = (
	history: Array< { amount: number; expires: string } > = []
): CreditExpirationInfo => {
	const sortedHistory = [ ...history ].sort( ( a, b ) =>
		moment( a.expires ).diff( moment( b.expires ) )
	);

	const hasExpiringCredits = sortedHistory.some( ( { expires } ) => {
		const exp = moment( expires );
		return (
			exp.isValid() &&
			exp.isAfter( moment(), 'day' ) &&
			exp.isSameOrBefore( moment().add( 1, 'month' ), 'day' )
		);
	} );

	return {
		hasExpiringCredits,
		sortedHistory,
	};
};
