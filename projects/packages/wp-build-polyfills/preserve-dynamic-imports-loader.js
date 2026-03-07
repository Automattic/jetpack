/**
 * Webpack loader that preserves dynamic import() calls as native browser imports.
 *
 * When webpack encounters `import(variable)` (a dynamic import with a non-string
 * argument), it creates a "context module" stub that always throws
 * "Cannot find module". This is because webpack can't statically determine what
 * module will be loaded at runtime.
 *
 * For packages like `@wordpress`/boot that rely on the browser's import map to
 * resolve module IDs at runtime, these dynamic imports must be preserved as
 * native `import()` calls. This loader adds `webpackIgnore: true` magic comments
 * to such imports, telling webpack to leave them as-is.
 *
 * Only import() calls with variable arguments are affected. String-literal
 * imports like `import("`@wordpress`/a11y")` are left untouched so that webpack's
 * externals plugin can handle them normally. Dynamic imports with leading
 * comments (e.g. `import(/* webpackChunkName: ... *\/ variable)`) are also
 * handled correctly.
 * @param {string} source - The source code to process.
 * @return {string} - The processed source code.
 */
module.exports = function preserveDynamicImports( source ) {
	return source.replace(
		/\bimport\(\s*(?!(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/|\s)*['"`])/g,
		'import(/* webpackIgnore: true */ '
	);
};
