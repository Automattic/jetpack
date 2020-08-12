/**
 * WordPress dependencies
 */
import { cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PaidSymbol from './paid-symbol';

/**
 * Enhance the default block icon with a paid indicator
 *
 * @param {object}  icon - The block default icon.
 * @returns {object} The default icon enhanced with the PaidSymbol
 */
const renderPaidIcon = icon => {
	if ( icon?.src ) {
		icon = {
			...icon,
			src: cloneElement( icon.src, {
				children: [ icon.src.props.children, <PaidSymbol /> ],
			} ),
		};
	} else if ( icon?.props?.children ) {
		icon = cloneElement( icon, {
			children: [ icon.props.children, <PaidSymbol /> ],
		} );
	}
	return icon;
};

export default renderPaidIcon;
