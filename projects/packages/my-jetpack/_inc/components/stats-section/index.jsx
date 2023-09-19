import { Container, Col, Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Icon, commentContent, people, starEmpty } from '@wordpress/icons';
import React from 'react';
import { useProduct } from '../../hooks/use-product';
import Card from '../card';
import Status from '../product-card/status';
import CountComparisonCard from './count-comparison-card';
import eye from './eye';
import styles from './style.module.scss';

/**
 * Stats section component.
 *
 * @param {object} props                - Component props.
 * @param {object} props.counts         - Counts object for the current period.
 * @param {object} props.previousCounts - Counts object for the previous period.
 *
 * @returns {object} StatsSection React component.
 */
const StatsSection = ( { counts, previousCounts } ) => {
	const { detail } = useProduct( 'stats' );

	return (
		<Container fluid>
			<Col lg={ 12 }>
				<Card title="Stats">
					<h3 className={ styles[ 'section-title' ] }>
						<span>{ __( '7-day highlights', 'jetpack-my-jetpack' ) }</span>

						<small className={ styles[ 'section-description' ] }>
							{ __( 'Compared to previous period', 'jetpack-my-jetpack' ) }
						</small>
					</h3>

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

					<div className={ styles.actions }>
						<Button
							size="small"
							weight="regular"
							variant="secondary"
							href={ 'admin.php?page=stats' }
							// onClick={ onClickSeeMore }
						>
							{ __( 'See detailed stats', 'jetpack-my-jetpack' ) }
						</Button>
						<Status status={ detail.status } />
					</div>
				</Card>
			</Col>
		</Container>
	);
};

export default StatsSection;
