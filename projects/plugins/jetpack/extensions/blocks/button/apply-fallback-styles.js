import { withFallbackStyles } from '@wordpress/components';
import { get } from 'lodash';

const applyFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { backgroundColor, textColor } = ownProps;
	const backgroundColorValue = get( backgroundColor, 'color' );
	const textColorValue = get( textColor, 'color' );

	// Avoid the use of querySelector if textColor color is known and verify if node is available.
	const textNode =
		! textColorValue && node ? node.querySelector( '[contenteditable="true"]' ) : null;

	return {
		fallbackBackgroundColor:
			backgroundColorValue || ! node ? undefined : getComputedStyle( node ).backgroundColor,
		fallbackTextColor: textColor || ! textNode ? undefined : getComputedStyle( textNode ).color,
	};
} );

export default applyFallbackStyles;
