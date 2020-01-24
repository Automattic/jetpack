/**
 * External dependencies
 */
import { getCategories, setCategories, registerBlockCollection } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import JetpackLogo from '../shared/jetpack-logo';

if ( typeof registerBlockCollection === 'function' ) {
	registerBlockCollection( 'jetpack', {
		title: 'Jetpack',
		icon: <JetpackLogo />,
	} );
} else {
	// This can be removed once G 7.3 is shipped in the Core version that is JP's minimum.
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
