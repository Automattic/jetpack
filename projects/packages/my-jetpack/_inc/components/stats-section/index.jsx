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
 */
const VISITS_OPTIONS = {
	period: 'day',
	quantity: 14,
	date: new Date( Date.now() + new Date().getTimezoneOffset() * 60000 ), // now in UTC to match Stats
};

/**
 * Process 14-day stats data to extract current and previous 7-day periods
 *
 * @param {object} visitsData - Raw visits data from API with fields and data arrays
 * @return {object} Object containing counts, previousCounts, and chartData for last 7 days
 */
const processStatsData = visitsData => {
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

	// Split into current week (0-6) and previous week (7-13)
	const currentWeekData = sortedData.slice( 0, 7 );
	const previousWeekData = sortedData.slice( 7, 14 );

	// Calculate totals for current week
	const counts = {
		views:
			viewsIndex !== -1
				? currentWeekData.reduce( ( sum, row ) => sum + ( row[ viewsIndex ] || 0 ), 0 )
				: 0,
		visitors:
			visitorsIndex !== -1
				? currentWeekData.reduce( ( sum, row ) => sum + ( row[ visitorsIndex ] || 0 ), 0 )
				: 0,
		likes:
			likesIndex !== -1
				? currentWeekData.reduce( ( sum, row ) => sum + ( row[ likesIndex ] || 0 ), 0 )
				: 0,
		comments:
			commentsIndex !== -1
				? currentWeekData.reduce( ( sum, row ) => sum + ( row[ commentsIndex ] || 0 ), 0 )
				: 0,
	};

	// Calculate totals for previous week
	const previousCounts = {
		views:
			viewsIndex !== -1
				? previousWeekData.reduce( ( sum, row ) => sum + ( row[ viewsIndex ] || 0 ), 0 )
				: 0,
		visitors:
			visitorsIndex !== -1
				? previousWeekData.reduce( ( sum, row ) => sum + ( row[ visitorsIndex ] || 0 ), 0 )
				: 0,
		likes:
			likesIndex !== -1
				? previousWeekData.reduce( ( sum, row ) => sum + ( row[ likesIndex ] || 0 ), 0 )
				: 0,
		comments:
			commentsIndex !== -1
				? previousWeekData.reduce( ( sum, row ) => sum + ( row[ commentsIndex ] || 0 ), 0 )
				: 0,
	};

	// Create chart data with only current week (reverse to show chronological order)
	const chartData = {
		fields,
		data: currentWeekData.reverse(),
	};

	return {
		counts,
		previousCounts,
		chartData,
	};
};

/**
 * Stats section component for My Jetpack Stats product card with a chart and counts.
 *
 * @return {JSX.Element} Stats section component
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

	/**
	 * Called when "See detailed stats" button is clicked.
	 */
	const onDetailedStatsClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_stats_card_seedetailedstats_click', {
			product: slug,
		} );

		window.location.href = 'admin.php?page=stats&force_refresh=1';
	}, [ recordEvent ] );

	const shouldShowSecondaryButton = useCallback(
		() => !! ( status === PRODUCT_STATUSES.CAN_UPGRADE ),
		[ status ]
	);

	const viewStatsButton = {
		href: 'admin.php?page=stats',
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
				onDetailedStatsClick={ onDetailedStatsClick }
			/>
		</ProductCard>
	);
};

export default StatsSection;
