import { __ } from '@wordpress/i18n';
import React from 'react';
import CountComparisonCard from './count-comparison-card';
import styles from './style.module.scss';

/**
 * Stats cards component.
 *
 * @param {object} props                - Component props.
 * @param {object} props.counts         - Counts object for the current period.
 *
 * @returns {object} StatsCards React component.
 */
const StatsCards = ( { counts } ) => {
	return (
		<div className={ styles[ 'section-stats-highlights' ] }>
			<div className={ styles[ 'cards-list' ] }>
				<CountComparisonCard
					heading={ __( 'Views', 'jetpack-my-jetpack' ) }
					count={ counts?.views }
				/>
				<CountComparisonCard
					heading={ __( 'Visitors', 'jetpack-my-jetpack' ) }
					count={ counts?.visitors }
				/>
				<CountComparisonCard
					heading={ __( 'Likes', 'jetpack-my-jetpack' ) }
					count={ counts?.likes }
				/>
				<CountComparisonCard
					heading={ __( 'Comments', 'jetpack-my-jetpack' ) }
					count={ counts?.comments }
				/>
			</div>
		</div>
	);
};

export default StatsCards;
