import { __ } from '@wordpress/i18n';
import { Icon, commentContent, people, starEmpty } from '@wordpress/icons';
import React from 'react';
import CountComparisonCard from './count-comparison-card';
import eye from './eye';
import styles from './style.module.scss';

/**
 * Stats cards component.
 *
 * @param {object} props                - Component props.
 * @param {object} props.counts         - Counts object for the current period.
 * @param {object} props.previousCounts - Counts object for the previous period.
 * @param {number} props.headingLevel   - Heading level between 1 and 6.
 *
 * @return {object} StatsCards React component.
 */
const StatsCards = ( { counts, previousCounts, headingLevel } ) => {
	const Heading = `h${ headingLevel >= 1 && headingLevel <= 6 ? headingLevel : 3 }`;

	return (
		<div className={ styles[ 'section-stats-highlights' ] }>
			<Heading className={ styles[ 'section-title' ] }>
				<span>{ __( '7-day highlights', 'jetpack-my-jetpack' ) }</span>
				<small className={ styles[ 'section-description' ] }>
					{ __( 'Compared to previous period', 'jetpack-my-jetpack' ) }
				</small>
			</Heading>

			<div className={ styles[ 'cards-list' ] }>
				<CountComparisonCard
					heading={ __( 'Views', 'jetpack-my-jetpack' ) }
					icon={ <Icon icon={ eye } /> }
					count={ counts?.views }
					previousCount={ previousCounts?.views }
				/>
				<CountComparisonCard
					heading={ __( 'Visitors', 'jetpack-my-jetpack' ) }
					icon={ <Icon icon={ people } /> }
					count={ counts?.visitors }
					previousCount={ previousCounts?.visitors }
				/>
				<CountComparisonCard
					heading={ __( 'Likes', 'jetpack-my-jetpack' ) }
					icon={ <Icon icon={ starEmpty } /> }
					count={ counts?.likes }
					previousCount={ previousCounts?.likes }
				/>
				<CountComparisonCard
					heading={ __( 'Comments', 'jetpack-my-jetpack' ) }
					icon={ <Icon icon={ commentContent } /> }
					count={ counts?.comments }
					previousCount={ previousCounts?.comments }
				/>
			</div>
		</div>
	);
};

export default StatsCards;
