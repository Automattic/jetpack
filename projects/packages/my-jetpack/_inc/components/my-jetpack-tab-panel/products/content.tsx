import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { MY_JETPACK_SECTION_FEATURES } from '../constants';
import { getProductsSection, getProductsSectionTitle } from '../utils';
import { Products } from './products';
import styles from './styles.module.scss';

/**
 * The Products content component.
 *
 * @return The rendered component.
 */
const ProductsContent = () => {
	return (
		<section className={ clsx( styles.content, styles[ 'my-jetpack-products-tab__content' ] ) }>
			<h2>{ getProductsSectionTitle() }</h2>
			<p className={ styles.description }>
				{ getProductsSection() === MY_JETPACK_SECTION_FEATURES
					? __(
							'Manage and explore Jetpack features that boost growth, performance, and security.',
							'jetpack-my-jetpack'
					  )
					: __(
							'Manage and explore Jetpack products that boost growth, performance, and security.',
							'jetpack-my-jetpack'
					  ) }
			</p>
			<Products />
		</section>
	);
};

export { ProductsContent };
