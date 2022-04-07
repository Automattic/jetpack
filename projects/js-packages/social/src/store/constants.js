export const SUPPORTED_BLOCKS = {
	'core/gallery': {
		contentAttributes: [ 'images' ],
	},
	'core/heading': {
		contentAttributes: [ 'content' ],
	},
	'core/image': {
		contentAttributes: [ 'alt', 'url' ],
	},
	'core/list': {
		contentAttributes: [ 'values' ],
	},
	'core/paragraph': {
		contentAttributes: [ 'content' ],
	},
	'core/quote': {
		contentAttributes: [ 'value', 'citation' ],
	},
	'core/separator': {
		contentAttributes: [],
	},
	'core/spacer': {
		contentAttributes: [],
	},
	'core/verse': {
		contentAttributes: [ 'content' ],
	},
	'core/video': {
		contentAttributes: [ 'src' ],
	},
	'core/embed': {
		contentAttributes: [ 'url' ],
	},
	'jetpack/gif': {
		contentAttributes: [ 'giphyUrl' ],
	},
};

export const SUPPORTED_CONTAINER_BLOCKS = [ 'core/column', 'core/columns', 'core/group' ];
