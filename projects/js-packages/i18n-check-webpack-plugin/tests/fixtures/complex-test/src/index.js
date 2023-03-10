module.exports = {
	foo: require( './foo' ),
	bar: require( './bar' ),
	async: import( /* webpackChunkName: "async" */ './async' ),
};
