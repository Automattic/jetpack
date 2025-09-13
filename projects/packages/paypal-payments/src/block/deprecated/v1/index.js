import { RawHTML } from '@wordpress/element';

export default {
	attributes: {
		currency: {
			type: 'string',
			default: 'USD',
		},
		content: {
			type: 'string',
			default: '',
		},
		email: {
			type: 'string',
			default: '',
		},
		featuredMediaId: {
			type: 'number',
			default: 0,
		},
		featuredMediaUrl: {
			type: 'string',
			default: null,
		},
		featuredMediaTitle: {
			type: 'string',
			default: null,
		},
		multiple: {
			type: 'boolean',
			default: false,
		},
		price: {
			type: 'number',
		},
		productId: {
			type: 'number',
		},
		title: {
			type: 'string',
			default: '',
		},
	},
	supports: {
		align: false,
		className: false,
		customClassName: false,
		html: false,
		reusable: false,
	},
	save: ( { attributes } ) => {
		const { productId } = attributes;
		return productId ? <RawHTML>{ `[simple-payment id="${ productId }"]` }</RawHTML> : null;
	},
};
