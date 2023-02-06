import colorValidator from '../../../shared/colorValidator';

export default {
	stepHighlightColor: {
		type: 'string',
		validator: colorValidator,
	},
	stepTextColor: {
		type: 'string',
		validator: colorValidator,
	},
};
