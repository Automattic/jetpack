// eslint config for react-using projects. Extend this instead of .eslintrc.js.
module.exports = {
	root: true,
	parser: 'babel-eslint',
	extends: [ 'wpcalypso/react', './.eslintrc.js' ],
	settings: {
		react: {
			version: 'detect', // React version. "detect" automatically picks the version you have installed.
		},
	},
	rules: {
		'react/jsx-curly-spacing': [ 2, 'always' ],
		'react/jsx-no-bind': 2,
		// 'react/jsx-space-before-closing': 2,
		'react/jsx-tag-spacing': [ 2, { beforeSelfClosing: 'always' } ],
		'react/no-danger': 2,
		'react/no-did-mount-set-state': 2,
		'react/no-did-update-set-state': 2,
		'react/no-is-mounted': 2,
		'react/prefer-es6-class': 1,
		'react/no-string-refs': 0,
	},
};
