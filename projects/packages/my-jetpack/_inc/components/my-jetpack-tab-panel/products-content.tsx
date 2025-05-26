import { __ } from '@wordpress/i18n';

/**
 * The Products content component.
 *
 * @return The rendered component.
 */
export function ProductsContent() {
	return (
		<div>
			<h2>{ __( 'Products', 'jetpack-my-jetpack' ) }</h2>
		</div>
	);
}
