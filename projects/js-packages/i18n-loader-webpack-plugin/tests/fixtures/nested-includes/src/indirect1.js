module.exports = () =>
	import( /* webpackChunkName: "indirect2" */ './indirect2.js' ).then( v => v.default() );
