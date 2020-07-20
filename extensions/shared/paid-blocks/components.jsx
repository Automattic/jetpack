/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';

export const PremiumIcon = ( { icon, name } ) =>{
	const blockNames = name.split( '/' );
	const iconProps = icon?.src ? { icon: icon.src } : { icon };
	const cssClass = 'jetpack-premium-icon' + ( blockNames?.[ 1 ] ? ` jetpack-premium-${ blockNames[ 1 ] }-icon` : '' );

	return (
		<div className={ cssClass }>
			<Icon { ...iconProps } />
		</div>
	);
};
