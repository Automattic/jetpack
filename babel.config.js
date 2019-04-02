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
		'@babel/react',
	],
	plugins: [
		'@babel/proposal-class-properties',
		'@babel/transform-runtime',
		'@babel/transform-member-expression-literals',
		'@babel/transform-property-literals',
		'@babel/transform-reserved-words',
	],
};

module.exports = config;
