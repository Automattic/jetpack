/**
 * Internal dependencies
 */
import colorValidator from '../../shared/colorValidator';

export default {
	element: {
		type: 'string',
		enum: [ 'a', 'button', 'input' ],
	},
	saveInPostContent: {
		type: 'boolean',
		default: false,
	},
	uniqueId: {
		type: 'string',
	},
	text: {
		type: 'string',
	},
	placeholder: {
		type: 'string',
	},
	url: {
		type: 'string',
	},
	textColor: {
		type: 'string',
	},
	customTextColor: {
		type: 'string',
		validator: colorValidator,
	},
	backgroundColor: {
		type: 'string',
	},
	customBackgroundColor: {
		type: 'string',
		validator: colorValidator,
	},
	gradient: {
		type: 'string',
	},
	customGradient: {
		type: 'string',
	},
	borderRadius: {
		type: 'number',
	},
};
