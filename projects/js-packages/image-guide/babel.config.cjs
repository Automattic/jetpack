module.exports = {
	targets: { node: 'current' },
	presets: [
		[ '@babel/preset-env', { bugfixes: true } ],
		[ '@babel/preset-typescript', { allowDeclareFields: true } ],
	],
};
