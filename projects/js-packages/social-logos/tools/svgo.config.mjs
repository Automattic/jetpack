// This config file is used by `tools/svg-cleanup`.
export default {
	plugins: [
		{
			name: 'preset-default',
			params: {
				overrides: {},
			},
		},
		{
			name: 'removeAttrs',
			params: {
				attrs: [ 'style', 'xml:space', 'id', 'fill' ],
				elemSeparator: '!',
			},
		},
		{
			name: 'addAttributesToSVGElement',
			params: {
				attributes: [ { viewBox: '0 0 24 24' }, { xmlns: 'http://www.w3.org/2000/svg' } ],
			},
		},
	],
};
