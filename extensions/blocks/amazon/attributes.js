const hexRegex = /^#?[A-Fa-f0-9]{6}$/;
const colourValidator = value => hexRegex.test( value );

export default {
	backgroundColor: {
		type: 'string',
		validator: colourValidator,
	},
	textColor: {
		type: 'string',
		validator: colourValidator,
	},
	buttonAndLinkColor: {
		type: 'string',
		validator: colourValidator,
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
