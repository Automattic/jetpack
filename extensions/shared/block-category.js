/**
 * External dependencies
 */
import { getCategories, setCategories } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import JetpackLogo from '../shared/jetpack-logo';

setCategories( [
	...getCategories().filter( ( { slug } ) => slug !== 'jetpack' ),
	// Add a Jetpack block category
	{
		slug: 'jetpack',
		title: 'Jetpack',
		icon: <JetpackLogo />,
	},
	{
		slug: 'premium',
		title: 'Premium',
		icon: <JetpackLogo fill="#d6b02c" />,
	},
] );
