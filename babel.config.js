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
		'@babel/react'
	],
	plugins: [
		'@babel/plugin-proposal-class-properties',
		'@babel/transform-runtime',
		'transform-member-expression-literals',
		'transform-property-literals',
		'transform-reserved-words',
	]
};

module.exports = config;
