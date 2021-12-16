module.exports = {
	// This project uses react, so load the shared react config.
	root: true,
	extends: [ '../../../.eslintrc.react.js' ],
	parserOptions: {
		requireConfigFile: false,
		babelOptions: {
			presets: [ '@babel/preset-react' ],
		},
	},
};
