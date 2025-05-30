import { Col, Container } from '@automattic/jetpack-components';
import { currentUserCan, isWoASite } from '@automattic/jetpack-script-data';
import ConnectionsSection from '../../connections-section';
import PlansSection from '../../plans-section';
import ProductCardsSection from '../../product-cards-section';
import { JetpackManageUpsell } from './jetpack-manage-upsell';
import styles from './styles.module.scss';

/**
 * The Overview content component.
 *
 * @return The rendered component.
 */
export function OverviewContent() {
	return (
		<div>
			<div className={ styles.products }>
				<ProductCardsSection />
			</div>

			{ currentUserCan( 'manage_options' ) ? (
				<div className={ styles[ 'jetpack-manage-upsell' ] }>
					<JetpackManageUpsell />
				</div>
			) : null }

			<div className={ styles.footer }>
				<Container horizontalSpacing={ 0 } className={ styles[ 'footer-container' ] }>
					<Col sm={ 4 } md={ 4 } lg={ 6 }>
						<PlansSection />
					</Col>
					<Col sm={ 4 } md={ 4 } lg={ 6 }>
						{ ! isWoASite() && <ConnectionsSection /> }
					</Col>
				</Container>
			</div>
		</div>
	);
}
