/**
 * Webpack plugin for creating a virtual module with CodeMirror language data
 *
 * This plugin creates a virtual module that can be imported using:
 * import { extensionsToLanguages, sortedLangNames } from '@@codemirrorLanguageData@@';
 *
 * The plugin generates the data from @codemirror/language-data at build time
 * and makes it available as a virtual module without writing files to disk.
 */

class CodeMirrorLanguageDataPlugin {
	static virtualModuleName = '@@codemirrorLanguageData@@';

	apply( compiler ) {
		compiler.hooks.normalModuleFactory.tap( 'CodeMirrorLanguageDataPlugin', factory => {
			factory.hooks.beforeResolve.tap( 'CodeMirrorLanguageDataPlugin', resolveData => {
				const request = resolveData.request;

				if ( request === CodeMirrorLanguageDataPlugin.virtualModuleName ) {
					// Generate the language data
					const moduleContent = this.generateModuleContent();

					// Create a virtual module
					resolveData.request = 'data:text/javascript,' + encodeURIComponent( moduleContent );
				}
			} );
		} );
	}

	generateModuleContent() {
		// Import @codemirror/language-data
		const { languages } = require( '@codemirror/language-data' );

		// Pairs of [extension: string, languageName: string];
		// These are used to map file extensions to language names in transform.
		const extensionsToLanguages = [];

		// Just language names, sorted alphabetically.
		// Used for language selectors.
		const sortedLangNames = [];

		// Process languages from @codemirror/language-data and add custom Log language
		for ( const lang of [ ...languages, { name: 'Log', extensions: [ 'log' ] } ] ) {
			sortedLangNames.push( lang.name );
			for ( const ext of lang.extensions ?? [] ) {
				extensionsToLanguages.push( [ ext, lang.name ] );
			}
		}

		// Sort language names alphabetically
		sortedLangNames.sort( ( a, b ) => a.localeCompare( b, undefined, 'base' ) );

		// Return the module content as a string
		return `export const extensionToLang = ${ JSON.stringify( extensionsToLanguages ) };
export const langNames = ${ JSON.stringify( sortedLangNames ) };`;
	}
}

module.exports = CodeMirrorLanguageDataPlugin;
