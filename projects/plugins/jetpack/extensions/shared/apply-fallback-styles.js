import { withFallbackStyles } from '@wordpress/components';

/**
 * HoC which will try to pick up the `color` and `backgroundColor`
 * values through DOM manipulation.
 */
export const applyFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { textColor, backgroundColor } = ownProps;
	const backgroundColorValue = backgroundColor && backgroundColor.color;
	const textColorValue = textColor && textColor.color;

	return {
		fallbackBackgroundColor:
			backgroundColorValue || ! node ? undefined : getComputedStyle( node ).backgroundColor,
		fallbackTextColor: textColorValue || ! node ? undefined : getComputedStyle( node ).color,
	};
} );
