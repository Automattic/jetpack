const loadTextDomainFromComposerJson = require( './load-textdomain-from-composer-json.js' );
const TranspileRule = require( './transpile-rule.js' );

/**
 * Provide transpile rules for bundled `@wordpress/*` packages.
 *
 * If bundled packages contain `@wordpress/i18n` calls, the i18n doesn't actually work due to
 * mismatched text domains. Our `@automattic/babel-plugin-replace-textdomain` plugin fixes that,
 * but it needs to be applied. This supplies the needed rules to do so for `@wordpress/*` packages
 * that aren't extracted by `@wordpress/dependency-extraction-webpack-plugin`.
 *
 * This also provides a rule that works around the totally broken i18n calls in the `@wordpress/dataviews/wp`
 * entry point.
 *
 * @see https://developer.wordpress.com/2022/01/06/wordpress-plugin-i18n-webpack-and-composer/
 * @see https://github.com/Automattic/jetpack/issues/39907
 *
 * @param {object} [options]            - Options.
 * @param {string} [options.textdomain] - Text domain for `@automattic/babel-plugin-replace-textdomain`.
 * @return {object[]} Transpilation rules.
 */
const BundledWpPkgsTranspileRules = ( options = {} ) => {
	const textdomain = options.textdomain ?? loadTextDomainFromComposerJson();

	/**
	 * Transpile `@wordpress/dataviews` in node_modules too.
	 *
	 * Uses configFile: false to avoid inheriting babel.config.js, and
	 * manually applies textdomain replacement with i18n function variants
	 * to handle the aliased function names (e.g. __1, _x2) in the
	 * dataviews build-wp bundle.
	 *
	 * @see https://github.com/Automattic/jetpack/issues/39907
	 */
	const dataviewsWp = TranspileRule( {
		includeNodeModules: [ '@wordpress/dataviews/build-wp/' ],
		babelOpts: {
			configFile: false,
			plugins: [
				[ require.resolve( '@automattic/babel-plugin-replace-textdomain' ), { textdomain } ],
			],
		},
	} );

	// Add textdomains (but no other optimizations) for @wordpress/dataviews and @wordpress/ui.
	const textdomainsOnly = TranspileRule( {
		includeNodeModules: [ '@wordpress/dataviews/', '@wordpress/ui/' ],
		exclude: dataviewsWp.include,
		babelOpts: {
			configFile: false,
			plugins: [
				[ require.resolve( '@automattic/babel-plugin-replace-textdomain' ), { textdomain } ],
			],
		},
	} );

	return [ dataviewsWp, textdomainsOnly ];
};

module.exports = BundledWpPkgsTranspileRules;
