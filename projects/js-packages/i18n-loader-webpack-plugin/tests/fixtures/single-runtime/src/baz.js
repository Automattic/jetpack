module.exports = {
	noI18n: async () => ( await import( /* webpackChunkName: "noI18n" */ './noI18n.js' ) ).default,
};
