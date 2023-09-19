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
 * @returns {object} StatsSection React component.
 */
const StatsSection = () => {
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
							count={ 4652 }
							previousCount={ 3749 }
						/>
						<CountComparisonCard
							heading={ __( 'Visitors', 'jetpack-my-jetpack' ) }
							icon={ <Icon icon={ people } /> }
							count={ 1500 }
							previousCount={ 1200 }
						/>
						<CountComparisonCard
							heading={ __( 'Likes', 'jetpack-my-jetpack' ) }
							icon={ <Icon icon={ starEmpty } /> }
							count={ 107 }
							previousCount={ 111 }
						/>
						<CountComparisonCard
							heading={ __( 'Comments', 'jetpack-my-jetpack' ) }
							icon={ <Icon icon={ commentContent } /> }
							count={ 32 }
							previousCount={ 34 }
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
