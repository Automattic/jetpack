import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { PRODUCT_STATUSES } from '../../constants';
import { QUERY_STATS_COUNTS_KEY, getStatsHighlightsEndpoint } from '../../data/constants';
import useProduct from '../../data/products/use-product';
import useSimpleQuery from '../../data/use-simple-query';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import ProductCard from '../connected-product-card';
import StatsCards from './cards';

const StatsSection = () => {
	const slug = 'stats';
	const { blogID } = useMyJetpackConnection();
	const { detail } = useProduct( slug );
	const { status } = detail;
	const isAdmin = !! getMyJetpackWindowInitialState( 'userIsAdmin' );
	const { data: statsCounts } = useSimpleQuery( {
		name: QUERY_STATS_COUNTS_KEY,
		query: {
			path: getStatsHighlightsEndpoint( blogID ),
		},
	} );
	const counts = statsCounts?.past_seven_days || {};
	const previousCounts = statsCounts?.between_past_eight_and_fifteen_days || {};
	const { recordEvent } = useAnalytics();

	/**
	 * Called when "See detailed stats" button is clicked.
	 */
	const onDetailedStatsClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_stats_card_seedetailedstats_click', {
			product: slug,
		} );
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
		[ PRODUCT_STATUSES.ERROR ]: {
			label: __( 'Connect Jetpack to use Stats', 'jetpack-my-jetpack' ),
		},
	};

	return (
		<ProductCard
			admin={ isAdmin }
			slug={ slug }
			primaryActionOverride={ primaryActionOverride }
			secondaryAction={ viewStatsButton }
			showMenu
		>
			<StatsCards counts={ counts } previousCounts={ previousCounts } />
		</ProductCard>
	);
};

export default StatsSection;
