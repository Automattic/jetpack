import { __ } from '@wordpress/i18n';
import UnownedProductsCard from '../product-cards-section/unowned-products-card';
import styles from './styles.module.scss';

/**
 * The Products content component.
 *
 * @return The rendered component.
 */
const ProductsContent = () => {
	return (
		<section className={ styles[ 'my-jetpack-tab--content' ] }>
			<h2>{ __( 'Products', 'jetpack-my-jetpack' ) }</h2>
			<p className={ styles[ 'my-jetpack-tab--content-description' ] }>
				{ __(
					'Manage and explore Jetpack products that boost growth, performance, and security.',
					'jetpack-my-jetpack'
				) }
			</p>
			<UnownedProductsCard />
		</section>
	);
};

export { ProductsContent };
