module.exports = {
	hasI18n: async () => ( await import( /* webpackChunkName: "hasI18n" */ './hasI18n.js' ) ).default,
};
