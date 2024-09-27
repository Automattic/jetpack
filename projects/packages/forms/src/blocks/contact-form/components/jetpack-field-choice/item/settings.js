export default {
	apiVersion: 3,
	category: 'contact-form',
	attributes: {
		label: {
			type: 'string',
		},
		fieldType: {
			enum: [ 'checkbox', 'radio' ],
			default: 'checkbox',
		},
	},
	supports: {
		reusable: false,
		html: false,
		splitting: true,
	},
};
