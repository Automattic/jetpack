module.exports = ( { options: { preserveCssCustomProperties = true } } ) => {
	const plugins = {
		'postcss-custom-properties': {
			importFrom: [
				'./node_modules/@automattic/calypso-color-schemes/dist/calypso-color-schemes.css',
			],
			preserve: preserveCssCustomProperties,
		},
		autoprefixer: {},
	};

	return { plugins };
};
