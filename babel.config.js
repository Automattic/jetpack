const config = {
	presets: [
		[
			'@babel/env',
			{
				corejs: 2,
				modules: 'commonjs',
				useBuiltIns: 'entry',
			},
		],
		'@babel/preset-react'
	],
	plugins: [
		'@babel/plugin-proposal-class-properties',
		'@babel/plugin-transform-reserved-words',
		'@babel/transform-runtime',
		'transform-member-expression-literals',
		'transform-property-literals',
	]
};

module.exports = config;
