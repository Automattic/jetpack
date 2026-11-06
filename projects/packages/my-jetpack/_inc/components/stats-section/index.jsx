import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
import { PRODUCT_STATUSES } from '../../constants';
import useProduct from '../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useStatsVisits from '../../hooks/use-stats-visits';
import ProductCard from '../connected-product-card';
import StatsCards from './cards';

/**
 * Options for the stats visits hook
 *
 * @type {{ period: 'day', quantity: number, date: Date }}
 */
export const VISITS_OPTIONS = {
	period: 'day',
	quantity: 14,
	date: new Date( Date.now() + new Date().getTimezoneOffset() * 60000 ), // now in UTC to match Stats
};

/**
 * Split stats for twice a period into the latest period and the one before it.
 *
 * @param {object} visitsData - Raw visits data from API with fields and data arrays
 * @param {number} [days]     - The period's length in days.
 * @return {{ counts: object, previousCounts: object, chartData: ?{ fields: string[], data: Array } }} Object containing counts, previousCounts, and chartData for the latest period
 */
export const processStatsData = ( visitsData, days = 7 ) => {
	if (
		! visitsData ||
		! visitsData.fields ||
		! visitsData.data ||
		! Array.isArray( visitsData.data )
	) {
		return {
			counts: {},
			previousCounts: {},
			chartData: null,
		};
	}

	const { fields, data } = visitsData;

	// Find field indices
	const periodIndex = fields.indexOf( 'period' );

	if ( periodIndex === -1 ) {
		return {
			counts: {},
			previousCounts: {},
			chartData: null,
		};
	}

	// Find field indices
	const viewsIndex = fields.indexOf( 'views' );
	const visitorsIndex = fields.indexOf( 'visitors' );
	const likesIndex = fields.indexOf( 'likes' );
	const commentsIndex = fields.indexOf( 'comments' );

	// Sort data by date (most recent first)
	const sortedData = [ ...data ].sort( ( a, b ) => {
		return new Date( b[ periodIndex ] ) - new Date( a[ periodIndex ] );
	} );

	const currentData = sortedData.slice( 0, days );
	const previousData = sortedData.slice( days, days * 2 );

	// Calculate totals for the latest period
	const counts = {
		views:
			viewsIndex !== -1
				? currentData.reduce( ( sum, row ) => sum + ( row[ viewsIndex ] || 0 ), 0 )
				: 0,
		visitors:
			visitorsIndex !== -1
				? currentData.reduce( ( sum, row ) => sum + ( row[ visitorsIndex ] || 0 ), 0 )
				: 0,
		likes:
			likesIndex !== -1
				? currentData.reduce( ( sum, row ) => sum + ( row[ likesIndex ] || 0 ), 0 )
				: 0,
		comments:
			commentsIndex !== -1
				? currentData.reduce( ( sum, row ) => sum + ( row[ commentsIndex ] || 0 ), 0 )
				: 0,
	};

	// Calculate totals for the period before it
	const previousCounts = {
		views:
			viewsIndex !== -1
				? previousData.reduce( ( sum, row ) => sum + ( row[ viewsIndex ] || 0 ), 0 )
				: 0,
		visitors:
			visitorsIndex !== -1
				? previousData.reduce( ( sum, row ) => sum + ( row[ visitorsIndex ] || 0 ), 0 )
				: 0,
		likes:
			likesIndex !== -1
				? previousData.reduce( ( sum, row ) => sum + ( row[ likesIndex ] || 0 ), 0 )
				: 0,
		comments:
			commentsIndex !== -1
				? previousData.reduce( ( sum, row ) => sum + ( row[ commentsIndex ] || 0 ), 0 )
				: 0,
	};

	// Chart only the latest period (reverse to show chronological order)
	const chartData = {
		fields,
		data: currentData.reverse(),
	};

	return {
		counts,
		previousCounts,
		chartData,
	};
};

/**
 * Build the link to the detailed stats page.
 *
 * @param {string}  manageUrl               - The Stats product's manage URL.
 * @param {boolean} premiumAnalyticsEnabled - Whether the URL is the Premium Analytics dashboard.
 * @return {string|undefined} The link, or undefined without a manage URL.
 */
export const getDetailedStatsHref = ( manageUrl, premiumAnalyticsEnabled ) => {
	const query = premiumAnalyticsEnabled ? '' : '&force_refresh=1';
	return manageUrl ? `${ manageUrl }${ query }` : undefined;
};

/**
 * Stats section component for My Jetpack Stats product card with a chart and counts.
 *
 * @return {import('react').JSX.Element} Stats section component
 */
const StatsSection = () => {
	const slug = 'stats';
	const { blogID, isSiteConnected } = useMyJetpackConnection();
	const { detail } = useProduct( slug );
	const { status } = detail;
	const isAdmin = !! getMyJetpackWindowInitialState( 'userIsAdmin' );
	const { recordEvent } = useAnalytics();

	// New stats visits hook for time series data
	const { data: visitsData, isLoading: isVisitsDataLoading } = useStatsVisits(
		blogID,
		isSiteConnected,
		VISITS_OPTIONS
	);

	// Process 14-day data to get current vs previous week comparison and chart data for last 7 days
	const processedData = useMemo( () => {
		return processStatsData( visitsData );
	}, [ visitsData ] );

	const { counts, previousCounts, chartData } = processedData;

	// The product's manage URL already points at whichever analytics UI this site
	// runs; that decision belongs server-side, so it is not re-derived here.
	const { manageUrl } = detail;
	const { premiumAnalyticsEnabled = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );

	/**
	 * Called when "See detailed stats" button is clicked.
	 */
	const onDetailedStatsClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_stats_card_seedetailedstats_click', {
			product: slug,
		} );
	}, [ recordEvent ] );

	const shouldShowSecondaryButton = useCallback(
		() => !! ( status === PRODUCT_STATUSES.CAN_UPGRADE && manageUrl ),
		[ status, manageUrl ]
	);

	const viewStatsHref = getDetailedStatsHref( manageUrl, premiumAnalyticsEnabled );

	const viewStatsButton = {
		href: viewStatsHref,
		label: __( 'View detailed stats', 'jetpack-my-jetpack' ),
		onClick: onDetailedStatsClick,
		shouldShowButton: shouldShowSecondaryButton,
	};

	// Override the primary action button to read "View detailed stats" instead
	// of the default text, "View".
	const primaryActionOverride = {
		[ PRODUCT_STATUSES.ACTIVE ]: {
			label: __( 'View detailed stats', 'jetpack-my-jetpack' ),
		},
		[ PRODUCT_STATUSES.SITE_CONNECTION_ERROR ]: {
			label: __( 'Connect Jetpack to use Stats', 'jetpack-my-jetpack' ),
		},
		[ PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION ]: {
			href: `#/add-${ slug }`,
		},
	};

	return (
		<ProductCard
			admin={ isAdmin }
			slug={ slug }
			primaryActionOverride={ primaryActionOverride } // "slim" variant removes buttons from the card but the card itself has useful connection checks - TODO: consifer extracting checks to a hook in case future card refactoring would simplify the components
			secondaryAction={ viewStatsButton }
			showMenu
			variant="slim"
		>
			<StatsCards
				counts={ counts }
				previousCounts={ previousCounts }
				headingLevel={ 3 }
				chartData={ chartData }
				isLoading={ isVisitsDataLoading }
				detailedStatsHref={ viewStatsHref }
				onDetailedStatsClick={ onDetailedStatsClick }
			/>
		</ProductCard>
	);
};

export default StatsSection;
