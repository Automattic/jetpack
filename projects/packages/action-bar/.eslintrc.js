module.exports = {
	parserOptions: {
		babelOptions: {
			configFile: require.resolve( './babel.config.js' ),
		},
	},
	rules: {
		'jsdoc/check-tag-names': [ 1, { definedTags: [ 'jest-environment' ] } ],
	},
};
