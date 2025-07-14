import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
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
			<h2>{ __( 'Products', 'jetpack-my-jetpack' ) }</h2>
			<p className={ styles.description }>
				{ __(
					'Manage and explore Jetpack products that boost growth, performance, and security.',
					'jetpack-my-jetpack'
				) }
			</p>
			<Products />
		</section>
	);
};

export { ProductsContent };
