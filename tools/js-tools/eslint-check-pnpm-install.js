const loadIgnorePatterns = require( './load-eslint-ignore.js' );

/* eslint-disable no-console */

/**
 * If `pnpm install` has not been run in a workspace in a local dev environment,
 * return an eslint config that effectively disables eslint.
 *
 * Note this always returns null in CI environments, as the CI setup should
 * have made sure `pnpm install` was run when necessary and we want CI to fail
 * if it wasn't.
 *
 * @param {string} dirname - Directory to test. Generally you'll pass `__dirname`.
 * @param {Function} require - Pass the `require` function.
 * @param {string} pkg - Package to resolve for testing, as for `require()` or `require.resolve()`.
 * @returns {object|null} Eslint config, or `null` if `pnpm install` was run.
 */
function eslintCheckPnpmInstall( dirname, require, pkg ) {
	if ( process.env.CI ) {
		return null;
	}

	try {
		require.resolve( pkg );
		return null;
	} catch ( e ) {
		const s = `Disabling eslint in ${ dirname } because \`pnpm install\` has not been run there.`;
		console.warn( '-'.repeat( s.length ) );
		console.warn( s );
		console.warn( '-'.repeat( s.length ) );
		return {
			root: true,
			parser: '@babel/eslint-parser',
			parserOptions: {
				requireConfigFile: false,
			},
			ignorePatterns: loadIgnorePatterns( dirname ),
			rules: {},
		};
	}
}

module.exports = eslintCheckPnpmInstall;
