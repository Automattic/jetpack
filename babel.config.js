const config = {
	presets: [
		[
			'@babel/env',
			{
				modules: 'commonjs',
				targets: { browsers: [ 'last 2 versions', 'Safari >= 10', 'iOS >= 10', 'ie >= 11' ] },
				useBuiltIns: 'entry',
				shippedProposals: true, // allows es7 features like Promise.prototype.finally
			},
		],
		'@babel/preset-react'
	],
	plugins: [
		'@babel/plugin-transform-member-expression-literals',
		'@babel/plugin-transform-react-jsx',
		'@babel/plugin-transform-runtime',

		// Stage 1
		'@babel/plugin-proposal-export-default-from',
		'@babel/plugin-proposal-logical-assignment-operators',
		[ '@babel/plugin-proposal-optional-chaining', { loose: false } ],
		[ '@babel/plugin-proposal-pipeline-operator', { proposal: 'minimal' } ],
		[ '@babel/plugin-proposal-nullish-coalescing-operator', { loose: false } ],
		'@babel/plugin-proposal-do-expressions',

		// Stage 2
		[ '@babel/plugin-proposal-decorators', { legacy: true } ],
		'@babel/plugin-proposal-function-sent',
		'@babel/plugin-proposal-export-namespace-from',
		'@babel/plugin-proposal-numeric-separator',
		'@babel/plugin-proposal-throw-expressions',

		// Stage 3
		'@babel/plugin-syntax-dynamic-import',
		'@babel/plugin-syntax-import-meta',
		[ '@babel/plugin-proposal-class-properties', { loose: false } ],
		'@babel/plugin-proposal-json-strings'
	]
};

module.exports = config;

