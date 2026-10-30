import fs from 'node:fs';
import path from 'node:path';
import stylelint from 'stylelint';

const {
	createPlugin,
	utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'jetpack/no-redundant-base-styles-wrapper';

const wrapperRegex = /^["']~?@automattic\/jetpack-base-styles\/gutenberg-base-styles["']/;

const messages = ruleMessages( ruleName, {
	rejected: () =>
		'This project depends on @wordpress/base-styles, so load the modules it needs directly (e.g. `@use "@wordpress/base-styles/mixins";`) instead of through @automattic/jetpack-base-styles/gutenberg-base-styles.',
} );

const declaresBaseStylesCache = new Map();

/**
 * Whether the nearest package.json above a directory declares `@wordpress/base-styles`.
 *
 * @param {string} dir - Directory to start from.
 * @return {boolean} Whether the dependency is declared.
 */
function declaresBaseStyles( dir ) {
	if ( declaresBaseStylesCache.has( dir ) ) {
		return declaresBaseStylesCache.get( dir );
	}
	let declares = false;
	const pkgFile = path.join( dir, 'package.json' );
	if ( fs.existsSync( pkgFile ) ) {
		const pkg = JSON.parse( fs.readFileSync( pkgFile, 'utf8' ) );
		declares = Boolean(
			pkg.dependencies?.[ '@wordpress/base-styles' ] ||
			pkg.devDependencies?.[ '@wordpress/base-styles' ]
		);
	} else if ( path.dirname( dir ) !== dir ) {
		declares = declaresBaseStyles( path.dirname( dir ) );
	}
	declaresBaseStylesCache.set( dir, declares );
	return declares;
}

/**
 * Report wrapper loads in files whose project declares `@wordpress/base-styles`.
 *
 * @type {import('stylelint').Rule}
 */
const ruleFunction = primary => {
	return ( root, result ) => {
		const validOptions = validateOptions( result, ruleName, {
			actual: primary,
			possible: [ true ],
		} );
		const file = root.source?.input?.file;
		if ( ! validOptions || ! file || ! declaresBaseStyles( path.dirname( file ) ) ) {
			return;
		}

		root.walkAtRules( /^(use|forward|import)$/, atRule => {
			if ( wrapperRegex.test( atRule.params ) ) {
				report( {
					message: messages.rejected(),
					node: atRule,
					result,
					ruleName,
				} );
			}
		} );
	};
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

/** @type {import('stylelint').Plugin} */
export default createPlugin( ruleName, ruleFunction );
