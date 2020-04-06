/**
 * External dependencies
 */
import { getCategories, setCategories, registerBlockCollection } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import JetpackLogo from '../shared/jetpack-logo';

/**
 * Return bool depending on registerBlockCollection compatibility.
 *
 * @todo When Jetpack's minimum is WP 5.4. Remove this function and update all block categories.
 *
 * @return {boolean} Value to indicate function support.
 */
export const supportsCollections = () => {
	return typeof registerBlockCollection === 'function';
};

if ( supportsCollections() ) {
	registerBlockCollection( 'jetpack', {
		title: 'Jetpack',
		icon: <JetpackLogo />,
	} );
} else {
	// This can be removed once Jetpack's minimum is Core 5.4.
	setCategories( [
		...getCategories().filter( ( { slug } ) => slug !== 'jetpack' ),
		// Add a Jetpack block category
		{
			slug: 'jetpack',
			title: 'Jetpack',
			icon: <JetpackLogo />,
		},
	] );
}

setCategories( [
	...getCategories().filter( ( { slug } ) => slug !== 'earn' ),
	// Add a Earn block category
	{
		slug: 'earn',
		title: __( 'Earn', 'jetpack' ),
		icon: <JetpackLogo />,
	},
] );

setCategories( [
	...getCategories().filter( ( { slug } ) => slug !== 'grow' ),
	// Add a Grow block category
	{
		slug: 'grow',
		title: __( 'Grow', 'jetpack' ),
		icon: <JetpackLogo />,
	},
] );
