/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { withFallbackStyles } from '@wordpress/components';

const applyFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { buttonBackgroundColor, buttonTextColor } = ownProps;
	const buttonBackgroundColorValue = get( buttonBackgroundColor, 'color' );
	const buttonTextColorValue = get( buttonTextColor, 'color' );

	// Avoid the use of querySelector if textColor color is known and verify if node is available.
	const textNode =
		! buttonTextColorValue && node ? node.querySelector( '[contenteditable="true"]' ) : null;

	return {
		buttonFallbackBackgroundColor:
			buttonBackgroundColorValue || ! node ? undefined : getComputedStyle( node ).backgroundColor,
		buttonFallbackTextColor:
			buttonTextColor || ! textNode ? undefined : getComputedStyle( textNode ).color,
	};
} );

export default applyFallbackStyles;
