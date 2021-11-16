/**
 * External dependencies
 */
import { getCategories, setCategories, registerBlockCollection } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { JetpackLogo } from './icons';
import { isAtomicSite, isSimpleSite } from '../shared/site-type-utils';

const isWpcom = isSimpleSite() || isAtomicSite();

// We do not want the Jetpack collection on WordPress.com (Simple or Atomic).
if ( ! isWpcom ) {
	registerBlockCollection( 'jetpack', {
		title: 'Jetpack',
		icon: <JetpackLogo />,
	} );
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
