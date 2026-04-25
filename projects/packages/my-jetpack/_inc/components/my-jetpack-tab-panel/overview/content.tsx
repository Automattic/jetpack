import { Col, Container } from '@automattic/jetpack-components';
import { currentUserCan } from '@automattic/jetpack-script-data';
import clsx from 'clsx';
import ConnectionsSection from '../../connections-section';
import PlansSection from '../../plans-section';
import ProductCardsSection from '../../product-cards-section';
import { FullWidthSeparator } from '../full-width-separator';
import parentStyles from '../styles.module.scss';
import { A4AUpsell } from './a4a-upsell';
import styles from './styles.module.scss';

/**
 * The Overview content component.
 *
 * @return The rendered component.
 */
export function OverviewContent() {
	return (
		<>
			<div
				className={ clsx(
					parentStyles[ 'constrained-section' ],
					parentStyles[ 'tab-content-wrapper' ]
				) }
			>
				<div className={ styles.products }>
					<ProductCardsSection />
				</div>

				{ currentUserCan( 'manage_options' ) ? (
					<div className={ styles[ 'jetpack-manage-upsell' ] }>
						<A4AUpsell />
					</div>
				) : null }
			</div>

			<FullWidthSeparator />

			<div className={ styles.footer }>
				<div className={ clsx( parentStyles[ 'constrained-section' ], styles[ 'footer-inner' ] ) }>
					<Container horizontalSpacing={ 0 } className={ styles[ 'footer-container' ] }>
						<Col sm={ 4 } md={ 4 } lg={ 6 }>
							<PlansSection />
						</Col>
						<Col sm={ 4 } md={ 4 } lg={ 6 }>
							<ConnectionsSection />
						</Col>
					</Container>
				</div>
			</div>
		</>
	);
}
