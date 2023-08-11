import colorValidator from '../../shared/colorValidator';

export default {
	backgroundColor: {
		type: 'string',
		validator: colorValidator,
	},
	textColor: {
		type: 'string',
		validator: colorValidator,
	},
	buttonAndLinkColor: {
		type: 'string',
		validator: colorValidator,
	},
	style: {
		type: 'string',
		default: 'small',
		validValues: [ 'small', 'large' ],
	},
	asin: {
		type: 'string',
	},
	showImage: {
		default: true,
		type: 'boolean',
	},
	showTitle: {
		default: true,
		type: 'boolean',
	},
	showSeller: {
		default: false,
		type: 'boolean',
	},
	showPrice: {
		default: true,
		type: 'boolean',
	},
	showPurchaseButton: {
		default: true,
		type: 'boolean',
	},
};
