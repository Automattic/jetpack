import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { JetpackLogo } from '@automattic/jetpack-shared-extension-utils/icons';
import { getCategories, setCategories, registerBlockCollection } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

const isWpcom = isSimpleSite() || isAtomicSite();

// We do not want the Jetpack collection on WordPress.com (Simple or Atomic).
if ( ! isWpcom ) {
	registerBlockCollection( 'jetpack', {
		title: 'Jetpack',
		icon: <JetpackLogo />,
	} );
}

// We're moving Form specific blocks to a new 'Forms' category
// that should appear before the 'monetize' and 'grow' categories
setCategories( [
	...getCategories().filter( ( { slug } ) => slug !== 'contact-form' ),
	{
		slug: 'contact-form',
		title: __( 'Forms', 'jetpack' ),
		icon: <JetpackLogo />,
	},
] );

setCategories( [
	...getCategories().filter( ( { slug } ) => slug !== 'monetize' ),
	// Add a Monetize block category
	{
		slug: 'monetize',
		title: __( 'Monetize', 'jetpack' ),
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
