/**
 * External dependencies
 */
import { isArray } from 'lodash';

/**
 * Internal dependencies
 */
import { PaidSymbol } from './paid-symbol.js';

const renderPremiumIcon = icon => {
	if ( icon.src ) {
		icon.src.props.children = [ icon.src.props.children, <PaidSymbol /> ];
	} else if ( icon?.props?.children && ! isArray( icon.props.children ) ) {
		icon.props.children = [ icon.props.children, <PaidSymbol /> ];
	} else if (
		icon?.props?.children &&
		isArray( icon.props.children ) &&
		! icon.props.children.includes( <PaidSymbol /> )
	) {
		icon.props.children = [ icon.props.children, <PaidSymbol /> ];
	}
	return icon;
};

export default renderPremiumIcon;
