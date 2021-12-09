module.exports = () =>
	import( /* webpackChunkName: "indirect1" */ './indirect1.js' ).then( v => v.default );
