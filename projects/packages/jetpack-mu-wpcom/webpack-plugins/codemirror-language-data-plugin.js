/**
 * Webpack plugin for creating a virtual module with CodeMirror language data
 *
 * This plugin creates a virtual module that can be imported using:
 * import { extensionToLang, langNames } from '@@codemirrorLanguageData@@';
 *
 * The plugin generates the data from @codemirror/language-data at build time
 * and makes it available as a virtual module without writing files to disk.
 */

const path = require( 'path' );

class CodeMirrorLanguageDataPlugin {
	/** @readonly */
	static virtualModuleName = '@@codemirrorLanguageData@@';

	/** @type {?string} */
	virtualModulePath = null;

	/**
	 * Plugin apply method.
	 *
	 * @param {import('webpack').Compiler} compiler -- The Webpack compiler instance.
	 */
	apply( compiler ) {
		// Create virtual file path
		this.virtualModulePath = path.resolve( compiler.context, this.constructor.virtualModuleName );

		// Hook into afterEnvironment to set up the virtual file system
		compiler.hooks.afterEnvironment.tap( this.constructor.name, () => {
			const content = this.generateModuleContent();
			this.writeVirtualFile( compiler.inputFileSystem, this.virtualModulePath, content );
		} );

		// Hook into normalModuleFactory to intercept module resolution
		compiler.hooks.normalModuleFactory.tap( 'CodeMirrorLanguageDataPlugin', factory => {
			factory.hooks.beforeResolve.tap( 'CodeMirrorLanguageDataPlugin', resolveData => {
				if ( resolveData.request === this.constructor.virtualModuleName ) {
					resolveData.request = this.virtualModulePath;
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

	/**
	 * Write the file.
	 *
	 * @param {import('webpack').InputFileSystem} fs       - Virtual file system.
	 * @param {string}                            filePath - Path.
	 * @param {string}                            contents - File contents.
	 */
	writeVirtualFile( fs, filePath, contents ) {
		const stats = {
			isFile: () => true,
			isDirectory: () => false,
			isBlockDevice: () => false,
			isCharacterDevice: () => false,
			isSymbolicLink: () => false,
			isFIFO: () => false,
			isSocket: () => false,
			dev: 8675309,
			nlink: 1,
			uid: 501,
			gid: 20,
			rdev: 0,
			blksize: 4096,
			ino: Math.random(),
			mode: 33188,
			size: contents ? contents.length : 0,
			blocks: Math.floor( contents ? contents.length / 4096 : 0 ),
			atime: new Date(),
			mtime: new Date(),
			ctime: new Date(),
			birthtime: new Date(),
		};

		// Store the file content
		const virtualData = {
			contents,
			stats,
		};

		// Patch the filesystem methods
		const originalReadFileSync = fs.readFileSync.bind( fs );
		const originalStatSync = fs.statSync.bind( fs );
		const originalReadFile = fs.readFile.bind( fs );
		const originalStat = fs.stat.bind( fs );

		fs.readFileSync = function ( filename, options ) {
			if ( filename === filePath ) {
				return virtualData.contents;
			}
			return originalReadFileSync( filename, options );
		};

		fs.statSync = function ( filename, options ) {
			if ( filename === filePath ) {
				return virtualData.stats;
			}
			return originalStatSync( filename, options );
		};

		fs.readFile = function ( filename, options, callback ) {
			if ( typeof options === 'function' ) {
				callback = options;
				options = undefined;
			}
			if ( filename === filePath ) {
				callback( null, virtualData.contents );
				return;
			}
			return originalReadFile( filename, options, callback );
		};

		fs.stat = function ( filename, callback ) {
			if ( filename === filePath ) {
				callback( null, virtualData.stats );
				return;
			}
			return originalStat( filename, callback );
		};
	}
}

module.exports = CodeMirrorLanguageDataPlugin;
