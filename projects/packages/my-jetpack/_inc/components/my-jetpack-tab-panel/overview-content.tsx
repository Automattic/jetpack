import { Col, Container } from '@automattic/jetpack-components';
import { isAtomicSite } from '@automattic/jetpack-script-data';
import ConnectionsSection from '../connections-section';
import PlansSection from '../plans-section';
import ProductCardsSection from '../product-cards-section';

/**
 * The Overview content component.
 *
 * @return The rendered component.
 */
export function OverviewContent() {
	return (
		<div>
			<ProductCardsSection />
			<Container horizontalSpacing={ 8 }>
				<Col sm={ 4 } md={ 4 } lg={ 6 }>
					<PlansSection />
				</Col>
				<Col sm={ 4 } md={ 4 } lg={ 6 }>
					{ ! isAtomicSite() && <ConnectionsSection /> }
				</Col>
			</Container>
		</div>
	);
}
