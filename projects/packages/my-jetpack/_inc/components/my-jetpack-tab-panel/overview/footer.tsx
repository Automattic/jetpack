import { Col, Container } from '@automattic/jetpack-components';
import ConnectionsSection from '../../connections-section';
import PlansSection from '../../plans-section';
import styles from './styles.module.scss';

/**
 * The Overview footer band — a full-width white strip holding the Plans and
 * Connection columns. Rendered by `TabContent` as a direct child of the
 * full-width tab content (outside the centered `.my-jetpack-tab-panel-inner`)
 * so its background spans edge-to-edge while `.footer-inner` re-centers the
 * columns.
 *
 * @return The rendered overview footer.
 */
export function OverviewFooter() {
	return (
		<div className={ styles.footer }>
			{ /* Needed to show different background colour */ }
			<div className={ styles[ 'footer-inner' ] }>
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
	);
}
