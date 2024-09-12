export default {
	align: {
		type: 'string',
		default: 'center',
	},
	className: {
		type: 'string',
		default: 'is-style-rectangular',
	},
	columns: {
		type: 'number',
	},
	columnWidths: {
		type: 'array',
		default: [],
	},
	ids: {
		type: 'array',
		default: [],
	},
	imageFilter: {
		type: 'string',
	},
	images: {
		type: 'array',
		default: [],
		source: 'query',
		selector: '.tiled-gallery__item',
		query: {
			alt: {
				attribute: 'alt',
				default: '',
				selector: 'img',
				source: 'attribute',
			},
			height: {
				attribute: 'data-height',
				type: 'number',
				selector: 'img',
				source: 'attribute',
			},
			id: {
				attribute: 'data-id',
				selector: 'img',
				source: 'attribute',
			},
			link: {
				attribute: 'data-link',
				selector: 'img',
				source: 'attribute',
			},
			url: {
				attribute: 'data-url',
				selector: 'img',
				source: 'attribute',
			},
			width: {
				attribute: 'data-width',
				selector: 'img',
				source: 'attribute',
				type: 'number',
			},
		},
	},
	imageCrop: {
		type: 'boolean',
		default: true,
	},
	linkTo: {
		default: 'none',
		type: 'string',
	},
	roundedCorners: {
		type: 'integer',
		default: 0,
	},
};
