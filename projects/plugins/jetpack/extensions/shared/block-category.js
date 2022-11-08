import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { getCategories, setCategories, registerBlockCollection } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { JetpackLogo } from './icons';

const isWpcom = isSimpleSite() || isAtomicSite();

// We do not want the Jetpack collection on WordPress.com (Simple or Atomic).
if ( ! isWpcom ) {
	registerBlockCollection( 'jetpack', {
		title: 'Jetpack',
		icon: <JetpackLogo />,
	} );
}

// We're moving Form specific blocks to a new 'Forms' category
// that should appear before the 'earn' and 'grow' categories
setCategories( [
	...getCategories().filter( ( { slug } ) => slug !== 'contact-form' ),
	{
		slug: 'contact-form',
		title: __( 'Forms', 'jetpack' ),
		icon: <JetpackLogo />,
	},
] );

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

setCategories( [
	// Create a different category for the Contact Form fields
	// to allow showing them first in the Block Library when a
	// Form block is selected
	{
		slug: 'contact-form-fields',
		title: __( 'Forms', 'jetpack' ),
		icon: <JetpackLogo />,
	},
	...getCategories().filter( ( { slug } ) => slug !== 'contact-form-fields' ),
] );
