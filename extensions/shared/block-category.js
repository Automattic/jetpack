/**
 * External dependencies
 */
import { getCategories, setCategories, registerBlockCollection } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import JetpackLogo from '../shared/jetpack-logo';

/**
 * Return bool depending on registerBlockCollection compatibility.
 *
 * @return {boolean} Value to indicate function support.
 */
export const supportsCollections = () => {
	if ( typeof registerBlockCollection === 'function' ) {
		return true;
	}
	return false;
};

if ( supportsCollections() ) {
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

setCategories( [
	...getCategories().filter( ( { slug } ) => slug !== 'earn' ),
	// Add a Jetpack block category
	{
		slug: 'earn',
		title: 'Earn',
		icon: <JetpackLogo />,
	},
] );

setCategories( [
	...getCategories().filter( ( { slug } ) => slug !== 'marketing' ),
	// Add a Jetpack block category
	{
		slug: 'marketing',
		title: 'Marketing',
		icon: <JetpackLogo />,
	},
] );
