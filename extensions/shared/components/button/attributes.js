/**
 * Internal dependencies
 */
import colorValidator from '../../colorValidator';

export default function getButtonAttributes( {
	defaultPlaceholder,
	defaultText,
	hasPlaceholder,
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
