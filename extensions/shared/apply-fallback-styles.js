/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { withFallbackStyles } from '@wordpress/components';

/**
 * HoC which will try to pick up the `color` and `backgroundColor`
 * values through DOM manipulation.
 */
export const applyFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { textColor, backgroundColor } = ownProps;
	const backgroundColorValue = backgroundColor && backgroundColor.color;
	const textColorValue = textColor && textColor.color;
	//avoid the use of querySelector if textColor color is known and verify if node is available.
	const textNode =
		! textColorValue && node ? node.querySelector( '[contenteditable="true"]' ) : null;
	return {
		fallbackBackgroundColor:
			backgroundColorValue || ! node ? undefined : getComputedStyle( node ).backgroundColor,
		fallbackTextColor:
			textColorValue || ! textNode ? undefined : getComputedStyle( textNode ).color,
	};
} );
