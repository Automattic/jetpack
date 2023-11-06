import { Container, Col, Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Icon, commentContent, people, starEmpty } from '@wordpress/icons';
import React, { useCallback } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import { useProduct } from '../../hooks/use-product';
import Card from '../card';
import { PRODUCT_STATUSES } from '../product-card';
import Status from '../product-card/status';
import CountComparisonCard from './count-comparison-card';
import eye from './eye';
import styles from './style.module.scss';

/**
 * Stats cards component.
 *
 * @param {object} props                - Component props.
 * @param {object} props.counts         - Counts object for the current period.
 * @param {object} props.previousCounts - Counts object for the previous period.
 *
 * @returns {object} StatsCards React component.
 */
const StatsCards = ( { counts, previousCounts } ) => {
	const { detail } = useProduct( 'stats' );
	const { recordEvent } = useAnalytics();
	const statsHasError = detail.status === PRODUCT_STATUSES.ERROR;

	/**
	 * Function called when the button is clicked.
	 */
	const onActionButtonClick = useCallback( () => {
		const subActionName = statsHasError ? 'fixconnection' : 'seedetailedstats';

		recordEvent( `jetpack_myjetpack_stats_card_${ subActionName }_click`, {
			product: 'stats',
		} );
	}, [ statsHasError, recordEvent ] );

	const buttonHref = statsHasError ? '#/connection' : 'admin.php?page=stats';

	return (
		<Container fluid horizontalSpacing={ 0 }>
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
							variant={ statsHasError ? 'primary' : 'secondary' }
							href={ buttonHref }
							onClick={ onActionButtonClick }
						>
							{ statsHasError && __( 'Fix connection', 'jetpack-my-jetpack' ) }
							{ ! statsHasError && __( 'See detailed stats', 'jetpack-my-jetpack' ) }
						</Button>
						<Status status={ detail.status } />
					</div>
				</Card>
			</Col>
		</Container>
	);
};

export default StatsCards;
