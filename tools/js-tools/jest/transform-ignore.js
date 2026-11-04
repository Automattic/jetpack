/**
 * The `transformIgnorePatterns` entry shared by every jest config.
 *
 * Jest ignores a file when any pattern matches, so a config cannot add
 * exceptions by appending a second pattern; it has to extend this one.
 */

/** Paths under `node_modules` that babel-jest must transform anyway. */
const TRANSFORMED_NODE_MODULES = [
	// esm-only
	'marked/',
	'uuid/',
	'@wordpress/theme/',
	// loaded as ESM through resolver.js
	'@wordpress/components/',
	'@wordpress/block-editor/',
	// esm-only, pulled in by @wordpress/block-editor's ESM build
	'parsel-js/',
	// stylesheets imported by components
	'uplot/.*\\.css',
	'@wordpress/admin-ui/.*\\.css',
	'@gravatar-com/.*\\.css',
];

/**
 * Build the pattern, with extra exceptions for one project.
 *
 * The first lookahead keeps the match on the outermost `node_modules`, so a
 * nested copy in pnpm's store is judged by the same exceptions.
 *
 * @param {string[]} extras - Regex fragments for more paths to transform.
 * @return {string} Pattern for `transformIgnorePatterns`.
 */
function transformIgnorePattern( extras = [] ) {
	return `/node_modules/(?!.*/node_modules/)(?!${ [ ...TRANSFORMED_NODE_MODULES, ...extras ].join(
		'|'
	) })`;
}

module.exports = { TRANSFORMED_NODE_MODULES, transformIgnorePattern };
