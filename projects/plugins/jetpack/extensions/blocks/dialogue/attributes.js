/**
 * Internal dependencies
 */
import colorValidator from '../../shared/colorValidator';

export default {
	label: {
		type: 'string',
	},
	labelTextColor: {
		type: 'string',
		validator: colorValidator,
	},
	slug: {
		type: 'string',
	},
	timestamp: {
		type: 'string',
		default: '00:00',
	},
	showTimestamp: {
		type: 'boolean',
		default: false,
	},
	placeholder: {
		type: 'string',
	},
	content: {
		type: 'string',
		source: 'html',
		selector: '.wp-block-jetpack-dialogue__content',
	},
};
