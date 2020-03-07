/**
 * Internal dependencies
 */
import colorValidator from '../../colorValidator';

/**
 * Create an object of Button attributes.
 * The parameter is an optional object, and all its properties are optional as well.
 *
 * @param {string} [defaultPlaceholder] The default button placeholder text.
 * @param {string} [defaultText] The default button text.
 * @param {boolean} [hasPlaceholder] Whether the button has a `buttonPlaceholder` attribute.
 * @param {boolean} [hasUrl] Whether the button has a `buttonUrl` attribute.
 * @param {Function} [urlValidator] A function to validate the `buttonUrl` attribute.
 * @returns {Object} The button attributes.
 */
export default function getButtonAttributes( {
	defaultPlaceholder,
	defaultText,
	hasPlaceholder,
	hasUrl,
	urlValidator,
} = {} ) {
	return {
		buttonText: {
			type: 'string',
			default: defaultText,
		},
		...( hasPlaceholder && {
			buttonPlaceholder: {
				type: 'string',
				default: defaultPlaceholder,
			},
		} ),
		...( hasUrl && {
			buttonUrl: {
				type: 'string',
				validator: urlValidator,
			},
		} ),
		buttonTextColor: {
			type: 'string',
		},
		customButtonTextColor: {
			type: 'string',
			validator: colorValidator,
		},
		buttonBackgroundColor: {
			type: 'string',
		},
		customButtonBackgroundColor: {
			type: 'string',
			validator: colorValidator,
		},
		buttonGradient: {
			type: 'string',
		},
		customButtonGradient: {
			type: 'string',
		},
		buttonBorderRadius: {
			type: 'number',
		},
	};
}
