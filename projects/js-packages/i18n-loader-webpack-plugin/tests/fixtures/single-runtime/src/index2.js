module.exports = {
	hasI18n: async () => ( await import( /* webpackChunkName: "hasI18n" */ './hasI18n.js' ) ).default,
	hasI18n2: async () =>
		( await import( /* webpackChunkName: "hasI18n2" */ './hasI18n2.js' ) ).default,
};
