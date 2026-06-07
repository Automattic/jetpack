/**
 * `src/` CSS modules are vendored verbatim from WordPress core's dashboard widget
 * engine, which allows longer lines than Jetpack's 80-char limit. Disabling the rule
 * keeps the port faithful and avoids churn on every upstream re-sync.
 *
 * @type {import('stylelint').Config}
 */
const config = {
	extends: 'jetpack-js-tools/stylelint.config.base.mjs',
	rules: {
		'@stylistic/max-line-length': null,
	},
};

export default config;
