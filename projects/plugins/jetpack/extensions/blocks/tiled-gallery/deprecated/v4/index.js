import { LAYOUT_DEFAULT } from './constants';

export { default as save } from './save';

export const attributes = {
	// Set default align
	align: {
		default: 'center',
		type: 'string',
	},
	// Set default className (used with block styles)
	className: {
		default: `is-style-${ LAYOUT_DEFAULT }`,
		type: 'string',
	},
	columns: {
		type: 'number',
	},
	columnWidths: {
		default: [],
		type: 'array',
	},
	ids: {
		default: [],
		type: 'array',
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
				selector: 'img',
				source: 'attribute',
				type: 'number',
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

export const supports = {
	align: [ 'center', 'wide', 'full' ],
	color: {
		gradients: true,
		text: false,
	},
	customClassName: false,
	html: false,
	spacing: {
		margin: true,
		padding: true,
	},
	__experimentalHideChildBlockControls: true,
};
