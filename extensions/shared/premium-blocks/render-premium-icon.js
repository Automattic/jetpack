/**
 * Internal dependencies
 */
import PaidSymbol from './paid-symbol';

const renderPremiumIcon = icon => {
	if ( icon.src ) {
		icon.src.props.children = [ icon.src.props.children, PaidSymbol ];
	} else if ( icon?.props?.children ) {
		icon.props.children = [ icon.props.children, <PaidSymbol /> ];
	}
	return icon;
};

export default renderPremiumIcon;
