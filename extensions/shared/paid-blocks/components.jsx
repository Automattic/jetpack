/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';

export const PremiumIcon = ( { icon, name } ) =>
	<div className={ `jetpack-premium-icon jetpack-premium-${ name }-icon` }>
		<Icon icon={ icon } />
</div>;
