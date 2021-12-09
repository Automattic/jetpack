module.exports = {
	md5: async () => ( await import( /* webpackChunkName: "md5" */ 'md5-es' ) ).default.hash,
	noI18n: async () => ( await import( /* webpackChunkName: "noI18n" */ './noI18n.js' ) ).default,
	hasI18n: async () => ( await import( /* webpackChunkName: "hasI18n" */ './hasI18n.js' ) ).default,
};
