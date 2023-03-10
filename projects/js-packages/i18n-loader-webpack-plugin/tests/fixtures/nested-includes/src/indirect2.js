module.exports = () =>
	import( /* webpackChunkName: "hasI18n" */ './hasI18n.js' ).then( v => v.default );
