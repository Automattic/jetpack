const fs = require( 'fs' );
const path = require( 'path' );
const debugload = require( 'debug' )( 'load-eslint-ignore:load' );
const debugrp = require( 'debug' )( 'load-eslint-ignore:reverse-prefix' );
const debugrules = require( 'debug' )( 'load-eslint-ignore:rules' );
const makeIgnore = require( 'ignore' );

const rootdir = path.resolve( __dirname, '../..' ) + '/';

/**
 * Load `.gitignore` and `.eslintignore` recursively.
 *
 * @param {string} basedir - Base directory to start from.
 * @returns {string[]} Ignore patterns.
 */
function loadIgnorePatterns( basedir ) {
	const ignore = makeIgnore();
	const rules = [];

	basedir = path.resolve( basedir ) + '/';

	/**
	 * Load patterns from a gitignore-style file.
	 *
	 * @param {string} file - File to load from.
	 */
	function addIgnoreFile( file ) {
		if ( ! fs.existsSync( file ) ) {
			return;
		}

		debugload( ` -> Loading ${ path.relative( rootdir, file ) }` );

		// Escape various pattern characters in case someone has a weird directory name.
		const dir = path.dirname( file );
		const ignorePrefix = path.relative( rootdir, dir ).replace( /[*?[\\]/g, '\\$&' ) + '/';
		let rulesPrefix = path.relative( basedir, dir ).replace( /^[!#]|[*?[\\]/g, '\\$&' ) + '/';
		let reverseRulesPrefix = null;
		if ( rulesPrefix.startsWith( '../' ) ) {
			rulesPrefix = null;
			const reverseRulesPrefixStr = path.relative( dir, basedir );
			reverseRulesPrefix = reverseRulesPrefixStr.split( '/' ).map( p => p + '/' );
			if ( reverseRulesPrefix[ 0 ] === '../' ) {
				reverseRulesPrefix = null;
			} else {
				debugrp( `Checking reverse-prefix match on ${ reverseRulesPrefixStr }` );
			}
		}

		fs.readFileSync( file, { encoding: 'utf8' } )
			.split( '\n' )
			.filter( l => ! l.startsWith( '#' ) && ! /^\s*$/.test( l ) )
			.forEach( l => {
				// Trim trailing spaces and extract negation flag.
				let b = l.replace( /(?<!\\) +$/, '' ),
					n = '';
				if ( b.startsWith( '!' ) ) {
					n = '!';
					b = b.substr( 1 );
					if ( b === '' ) {
						throw new Error( `Empty negated pattern in ${ file }` );
					}
				}

				// If the pattern has a non-terminal `/`, the pattern is anchored at the start. Otherwise it's not.
				const i = b.indexOf( '/' );
				if ( i < 0 || i >= b.length - 1 ) {
					b = '**/' + b; // Not anchored, so add a `**/` to unanchor it.
				} else if ( i === 0 ) {
					b = b.substr( 1 ); // Avoid double `/`.
				}

				ignore.add( n + ignorePrefix + b );
				if ( rulesPrefix ) {
					rules.push( n + rulesPrefix + b );
				}
				if ( reverseRulesPrefix ) {
					for ( const part of reverseRulesPrefix ) {
						if ( b === '' ) {
							b = null;
							break;
						}
						if ( b.startsWith( '**/' ) ) {
							break;
						}
						const j = b.indexOf( '/' );
						let tmp;
						if ( j > 0 ) {
							tmp = b.substr( 0, j );
							b = b.substr( j ).replace( /^\/+/, '' );
						} else {
							tmp = b;
							b = '';
						}
						if ( tmp !== 'part/' && ! makeIgnore().add( tmp ).ignores( part ) ) {
							b = null;
							break;
						}
					}
					if ( b ) {
						debugrp( ` Accepted ${ l } as ${ n + '/' + b }` );
						rules.push( n + '/' + b );
					} else {
						debugrp( ` Rejected ${ l }` );
					}
				}
			} );
	}

	// Process the root directory, then every non-ignored subdirectory of it, using a stack for depth-first traversal.
	debugload(
		// prettier-ignore
		`Loading ignore patterns for ${ rootdir === basedir ? 'monorepo root' : path.relative( rootdir, basedir ) }`
	);
	const stack = [ rootdir ];
	while ( stack.length > 0 ) {
		const dir = stack.pop();
		addIgnoreFile( path.join( dir, '.gitignore' ) );
		if ( dir === rootdir ) {
			addIgnoreFile( path.join( dir, '.eslintignore.root' ) );
		} else {
			addIgnoreFile( path.join( dir, '.eslintignore' ) );
		}

		for ( const d of fs.readdirSync( dir, { withFileTypes: true } ) ) {
			const subdir = path.join( dir, d.name ) + '/';
			if (
				d.isDirectory() &&
				! ignore.ignores( path.relative( rootdir, subdir ) + '/' ) &&
				( subdir.startsWith( basedir ) || basedir.startsWith( subdir ) )
			) {
				stack.push( subdir );
			}
		}
	}

	if ( process.env.ESLINT_IGNORE_REQUIRED ) {
		for ( const file of JSON.parse(
			fs.readFileSync( path.join( __dirname, '../eslint-excludelist.json' ) )
		) ) {
			const f = path.relative( basedir, path.resolve( rootdir, file ) );
			if ( ! f.startsWith( '../' ) ) {
				rules.push( f );
			}
		}
	}

	if ( debugrules.enabled ) {
		debugrules(
			// prettier-ignore
			`# Ignore rules for ${ rootdir === basedir ? 'monorepo root' : path.relative( rootdir, basedir ) }`
		);
		debugrules( rules.join( '\n' ) );
	}
	return rules;
}

module.exports = loadIgnorePatterns;
