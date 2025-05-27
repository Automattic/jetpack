import ProductCardsSection from '../product-cards-section';
import styles from './styles.module.scss';

/**
 * The Overview content component.
 *
 * @return The rendered component.
 */
export function OverviewContent() {
	return (
		<div className={ styles[ 'overview-content' ] }>
			<ProductCardsSection />
		</div>
	);
}
