import { __ } from '@wordpress/i18n';
import UnownedProductsCard from '../product-cards-section/unowned-products-card';

/**
 * The Products content component.
 *
 * @return The rendered component.
 */
const ProductsContent = () => {
	return (
		<div>
			<h2>{ __( 'Products', 'jetpack-my-jetpack' ) }</h2>
			<UnownedProductsCard />
		</div>
	);
};

export { ProductsContent };
