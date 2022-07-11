import { getCategories, setCategories, registerBlockCollection } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { JetpackLogo, JetpackPoweredBadge } from './icons';

registerBlockCollection( 'jetpack', {
	title: 'Jetpack',
	icon: <JetpackPoweredBadge />,
} );

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
