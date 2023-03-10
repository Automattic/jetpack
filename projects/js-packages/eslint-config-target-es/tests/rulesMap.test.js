const mdn = require( '@mdn/browser-compat-data' );
const { rules: esRules } = require( 'eslint-plugin-es' );
const rulesMap = require( '../src/rulesMap.js' );

expect.extend( {
	toBeValidMapping( received ) {
		const options = {
			isNot: this.isNot,
			promise: this.promise,
		};

		let ok = false;
		if ( received === true || received === false ) {
			ok = true;
		} else if ( typeof received === 'string' ) {
			ok = true;
		} else if ( Array.isArray( received ) ) {
			ok = received.length > 0 && received.every( p => typeof p === 'string' );
		}
		if ( ok ) {
			return {
				message: () =>
					this.utils.matcherHint( 'toBeValidMapping', undefined, '', options ) +
					`\n\nReceived: ${ this.utils.printReceived( received ) }`,
				pass: true,
			};
		}
		return {
			message: () =>
				this.utils.matcherHint( 'toBeValidMapping', undefined, '', options ) +
				// prettier-ignore
				`\n\nExpected: a boolean, string, or array of strings.\nReceived: ${ this.utils.printReceived( received ) }`,
			pass: false,
		};
	},
	toBeValidMDNPath( received ) {
		const options = {
			isNot: this.isNot,
			promise: this.promise,
		};

		let data = mdn;
		const p = [];
		for ( const k of received.split( '.' ) ) {
			p.push( k );
			data = data[ k ];
			if ( ! data ) {
				return {
					message: () =>
						this.utils.matcherHint( 'toBeValidMDNPath', received, '', options ) +
						`\n\nPath ${ p.join( '.' ) } does not exist.`,
					pass: false,
				};
			} else if ( typeof data !== 'object' ) {
				return {
					message: () =>
						this.utils.matcherHint( 'toBeValidMDNPath', received, '', options ) +
						`\n\nPath ${ p.join( '.' ) } is not an object.`,
					pass: false,
				};
			}
		}
		if ( ! data.__compat || ! data.__compat.support ) {
			return {
				message: () =>
					this.utils.matcherHint( 'toBeValidMDNPath', received, '', options ) +
					`\n\nPath has no compat data.`,
				pass: false,
			};
		}
		return {
			message: () =>
				this.utils.matcherHint( 'toBeValidMDNPath', received, '', options ) + `\n\nPath is valid.`,
			pass: true,
		};
	},
} );

test( 'All rules are mapped', () => {
	expect( Object.keys( rulesMap ).sort() ).toEqual( Object.keys( esRules ).sort() );
} );

describe( 'All mappings are valid', () => {
	test.each( Object.entries( rulesMap ) )( 'Mapping for %s is valid', ( rule, paths ) => {
		expect( paths ).toBeValidMapping();
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
		expect( path ).toBeValidMDNPath();
	} );
} );
