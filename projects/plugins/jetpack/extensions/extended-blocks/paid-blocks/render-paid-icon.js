import { isUpgradable } from '@automattic/jetpack-shared-extension-utils';
import { cloneElement } from '@wordpress/element';
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
				children: [ icon.src.props.children, <PaidSymbol key="paid-symbol" /> ],
			} ),
		};
	} else if ( icon?.props?.children ) {
		icon = cloneElement( icon, {
			children: [ icon.props.children, <PaidSymbol key="paid-symbol" /> ],
		} );
	}
	return icon;
};

export default renderPaidIcon;

/**
 * Helper function to extend the given icon.
 * checking before if the block is upgradable.
 *
 * @param {string} name - Block name to check if it's upgradable.
 * @param {object} icon - Icon to extend, or not.
 * @returns {object} Block Icon.
 */
export function extendWithPaidIcon( name, icon ) {
	if ( ! isUpgradable( name ) ) {
		return icon;
	}

	return renderPaidIcon( icon );
}
