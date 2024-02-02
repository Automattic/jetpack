import { __ } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import { useProduct } from '../../hooks/use-product';
import useStatsCounts from '../../hooks/use-stats-counts';
import ProductCard from '../connected-product-card';
import { PRODUCT_STATUSES } from '../product-card/action-button';
import StatsCards from './cards';

const StatsSection = () => {
	const { detail } = useProduct( 'stats' );
	const { status } = detail;
	const { userIsAdmin } = window?.myJetpackInitialState ?? false;
	const { statsCounts } = useStatsCounts();
	const counts = statsCounts?.past_seven_days || {};
	const previousCounts = statsCounts?.between_past_eight_and_fifteen_days || {};
	const { recordEvent } = useAnalytics();

	/**
	 * Called when "See detailed stats" button is clicked.
	 */
	const onDetailedStatsClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_stats_card_seedetailedstats_click', {
			product: 'stats',
		} );
	}, [ recordEvent ] );

	const shouldShowSecondaryButton = useCallback(
		() => !! ( status === PRODUCT_STATUSES.ACTIVE || status === PRODUCT_STATUSES.CAN_UPGRADE ),
		[ status ]
	);

	const viewStatsButton = {
		href: 'admin.php?page=stats',
		label: __( 'View detailed stats', 'jetpack-my-jetpack' ),
		onClick: onDetailedStatsClick,
		shouldShowButton: shouldShowSecondaryButton,
	};

	return (
		<ProductCard
			admin={ userIsAdmin }
			slug={ 'stats' }
			secondaryAction={ viewStatsButton }
			showMenu
		>
			<StatsCards counts={ counts } previousCounts={ previousCounts } />
		</ProductCard>
	);
};

export default StatsSection;
