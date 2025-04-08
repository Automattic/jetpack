import { sprintf, __, _n } from '@wordpress/i18n';
import { Icon, commentContent, people, starEmpty } from '@wordpress/icons';
import React from 'react';
import formatNumber from '../../utils/format-number';
import CountComparisonCard from './count-comparison-card';
import createStatDiffText from './create-stat-diff-text';
import eye from './eye';
import styles from './style.module.scss';

/**
 * Creates the text read by screen readers for a stat card.
 *
 * @param {Function} countStat     - Function that accepts a number and calls _n() with that number to return the singular or plural form of the stat count.
 *                                 E.g. countStat( 1 ) returns '%s view', countStat( 5 ) returns '%s views'
 * @param {number}   count         - The current count value.
 * @param {number}   previousCount - The previous period's count value.
 * @return {string} Screen reader text
 */

const createStatSRText = ( countStat, count, previousCount ) => {
	if ( typeof count !== 'number' ) {
		return '';
	}

	const fragments = [];
	const statCountText = sprintf( countStat( count ), formatNumber( count ) );

	fragments.push( statCountText.endsWith( '.' ) ? statCountText : `${ statCountText }.` );
	fragments.push( createStatDiffText( countStat, count, previousCount ) );

	return fragments.filter( Boolean ).join( ' ' );
};

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

			<ul className={ styles[ 'cards-list' ] }>
				<CountComparisonCard
					heading={ __( 'Views', 'jetpack-my-jetpack' ) }
					srText={ createStatSRText(
						// translators: %s: number of views
						count => _n( '%s view', '%s views', count, 'jetpack-my-jetpack' ),
						counts?.views,
						previousCounts?.views
					) }
					icon={ <Icon icon={ eye } /> }
					count={ counts?.views }
					previousCount={ previousCounts?.views }
					as="li"
				/>
				<CountComparisonCard
					heading={ __( 'Visitors', 'jetpack-my-jetpack' ) }
					srText={ createStatSRText(
						// translators: %s: number of visitors
						count => _n( '%s visitor', '%s visitors', count, 'jetpack-my-jetpack' ),
						counts?.visitors,
						previousCounts?.visitors
					) }
					icon={ <Icon icon={ people } /> }
					count={ counts?.visitors }
					previousCount={ previousCounts?.visitors }
					as="li"
				/>
				<CountComparisonCard
					heading={ __( 'Likes', 'jetpack-my-jetpack' ) }
					srText={ createStatSRText(
						// translators: %s: number of likes
						count => _n( '%s like', '%s likes', count, 'jetpack-my-jetpack' ),
						counts?.likes,
						previousCounts?.likes
					) }
					icon={ <Icon icon={ starEmpty } /> }
					count={ counts?.likes }
					previousCount={ previousCounts?.likes }
					as="li"
				/>
				<CountComparisonCard
					heading={ __( 'Comments', 'jetpack-my-jetpack' ) }
					srText={ createStatSRText(
						// translators: %s: number of comments
						count => _n( '%s comment', '%s comments', count, 'jetpack-my-jetpack' ),
						counts?.comments,
						previousCounts?.comments
					) }
					icon={ <Icon icon={ commentContent } /> }
					count={ counts?.comments }
					previousCount={ previousCounts?.comments }
					as="li"
				/>
			</ul>
		</div>
	);
};

export default StatsCards;
