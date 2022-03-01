const rulesMap = require( '../src/rulesMap.js' );
const mdn = require( '@mdn/browser-compat-data' );
const { rules: esRules } = require( 'eslint-plugin-es' );

test( 'All rules are mapped', () => {
	expect( Object.keys( rulesMap ).sort() ).toEqual( Object.keys( esRules ).sort() );
} );

describe( 'All mappings are valid', () => {
	test.each( Object.entries( rulesMap ) )( 'Mapping for %s is valid', ( rule, paths ) => {
		if ( paths === true || paths === false ) {
			return;
		} else if ( typeof paths === 'string' ) {
			paths = [ paths ];
		} else if ( Array.isArray( paths ) ) {
			expect( paths ).not.toEqual( [] );
			for ( const path of paths ) {
				expect( path ).toEqual( expect.any( String ) );
			}
		} else {
			throw new Error(
				`Mapping should be a boolean, string, or array of strings. Got ${ typeof paths }.`
			);
		}
	} );

	const allpaths = new Set(
		Object.values( rulesMap ).flatMap( v => {
			if ( typeof v === 'string' ) {
				return [ v ];
			}
			if ( Array.isArray( v ) ) {
				return v;
			}
			return [];
		} )
	);
	test.each( [ ...allpaths ].sort().map( v => [ v ] ) )( 'MDN path %s exists', path => {
		let data = mdn;
		const p = [];
		for ( const k of path.split( '.' ) ) {
			p.push( k );
			data = data[ k ];
			if ( ! data ) {
				throw new Error( `Path ${ p.join( '.' ) } does not exist` );
			} else if ( typeof data !== 'object' ) {
				throw new Error( `Path ${ p.join( '.' ) } is not an object` );
			}
		}
		if ( ! data.__compat || ! data.__compat.support ) {
			throw new Error( 'Path has no compat data' );
		}
	} );
} );
