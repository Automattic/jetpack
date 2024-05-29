export default {
	align: {
		default: 'center',
		type: 'string',
	},
	autoplay: {
		type: 'boolean',
		default: false,
	},
	delay: {
		type: 'number',
		default: 3,
	},
	ids: {
		default: [],
		type: 'array',
	},
	images: {
		type: 'array',
		default: [],
		source: 'query',
		selector: '.swiper-slide',
		query: {
			alt: {
				source: 'attribute',
				selector: 'img',
				attribute: 'alt',
				default: '',
			},
			caption: {
				type: 'string',
				source: 'html',
				selector: 'figcaption',
			},
			id: {
				source: 'attribute',
				selector: 'img',
				attribute: 'data-id',
			},
			url: {
				source: 'attribute',
				selector: 'img',
				attribute: 'src',
			},
		},
	},
	effect: {
		type: 'string',
		default: 'slide',
	},
	sizeSlug: {
		type: 'string',
	},
};
