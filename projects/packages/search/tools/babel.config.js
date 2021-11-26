module.exports = api => {
	api.cache( true );
	return {
		presets: [ [ '@automattic/jetpack-webpack-config/babel/preset' ] ],
		plugins: [ '@babel/plugin-proposal-nullish-coalescing-operator' ],
	};
};
