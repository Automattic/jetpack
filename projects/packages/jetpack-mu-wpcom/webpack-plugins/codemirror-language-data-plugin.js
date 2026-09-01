/**
 * Webpack plugin for creating a virtual module with CodeMirror language data
 *
 * This plugin creates a virtual module that can be imported using:
 * import { extensionToLang } from '@@codemirrorLanguageData@@';
 *
 * The plugin generates the data from `@codemirror/language-data` at build time
 * and makes it available as a virtual module without writing files to disk.
 */

/**
 * @import * as webpack from 'webpack'
 */

const crypto = require( 'crypto' );
const path = require( 'path' );

class CodeMirrorLanguageDataPlugin {
	/** @readonly */
	static virtualModuleName = '@@codemirrorLanguageData@@';

	/** @type {?string} */
	virtualModulePath = null;

	/**
	 * Plugin apply method.
	 *
	 * @param {webpack.Compiler} compiler -- The Webpack compiler instance.
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
		const extensionsToLanguages = [ [ 'log', 'Log' ] ];

		// Process languages from @codemirror/language-data and add custom Log language
		for ( const lang of [ ...languages ] ) {
			for ( const ext of lang.extensions ?? [] ) {
				extensionsToLanguages.push( [ ext, lang.name ] );
			}
		}

		// Return the module content as a string
		return `export const extensionToLang = ${ JSON.stringify( extensionsToLanguages ) };`;
	}

	/**
	 * Generate a stable inode based on the virtual file path.
	 *
	 * @param {string} filePath - The virtual file path.
	 * @return {number} A stable inode number.
	 */
	generateStableInode( filePath ) {
		// Create a hash and read the first 4 bytes as a 32-bit integer
		const buf = crypto
			.createHash( 'sha1' )
			.update( filePath + this.constructor.virtualModuleName )
			.digest();

		// Read first 4 bytes as unsigned 32-bit integer
		return buf.readUInt32BE( 0 );
	}

	/**
	 * Write the file.
	 *
	 * @param {webpack.InputFileSystem} fs       - Virtual file system.
	 * @param {string}                  filePath - Path.
	 * @param {string}                  contents - File contents.
	 */
	writeVirtualFile( fs, filePath, contents ) {
		// eslint-disable-next-line jsdoc/ts-no-empty-object-type
		/** @type {Extract<ReturnType<NonNullable<webpack.InputFileSystem['statSync']>>,{}>} */
		const stats = {
			isFile: () => true,
			isDirectory: () => false,
			isBlockDevice: () => false,
			isCharacterDevice: () => false,
			isSymbolicLink: () => false,
			isFIFO: () => false,
			isSocket: () => false,
			dev: 2003_05_27,
			nlink: 1,
			uid: 501,
			gid: 20,
			rdev: 0,
			blksize: 4096,
			ino: this.generateStableInode( filePath ),
			mode: 33188,
			size: contents ? contents.length : 0,
			blocks: Math.floor( contents ? contents.length / 4096 : 0 ),
			atime: new Date(),
			mtime: new Date(),
			ctime: new Date(),
			birthtime: new Date(),
		};

		// Patch the filesystem methods
		const originalReadFileSync = fs.readFileSync.bind( fs );
		const originalStatSync = fs.statSync.bind( fs );
		const originalReadFile = fs.readFile.bind( fs );
		const originalStat = fs.stat.bind( fs );

		fs.readFileSync = function ( filename, options ) {
			if ( filename === filePath ) {
				return contents;
			}
			return originalReadFileSync( filename, options );
		};

		fs.statSync = function ( filename, options ) {
			if ( filename === filePath ) {
				return stats;
			}
			return originalStatSync( filename, options );
		};

		fs.readFile = function ( filename, options, callback ) {
			if ( typeof options === 'function' ) {
				callback = options;
				options = undefined;
			}
			if ( filename === filePath ) {
				callback( null, contents );
				return;
			}
			return originalReadFile( filename, options, callback );
		};

		fs.stat = function ( filename, callback ) {
			if ( filename === filePath ) {
				callback( null, stats );
				return;
			}
			return originalStat( filename, callback );
		};
	}
}

module.exports = CodeMirrorLanguageDataPlugin;
