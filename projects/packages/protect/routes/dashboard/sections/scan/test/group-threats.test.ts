import { groupThreats, parseThreatIds } from '../group-threats';
import type { ScanThreat } from '../types';

const threat = ( id: number, status: ScanThreat[ 'status' ] ) =>
	( { id, status, title: `Threat ${ id }` } ) as ScanThreat;

const ids = ( threats: ScanThreat[] ) => threats.map( item => String( item.id ) );

describe( 'parseThreatIds', () => {
	it.each( [
		[ 'a comma-separated list', '3,1,2', [ '3', '1', '2' ] ],
		[ 'a single id the router parsed as a number', 7, [ '7' ] ],
		[ 'non-digit entries and spaces', ' 4 ,abc,5x,,6', [ '4', '6' ] ],
		[ 'duplicates, keeping the first', '2,1,2', [ '2', '1' ] ],
		[ 'nothing', undefined, [] ],
		[ 'an array or object', [ '1' ], [] ],
	] )( 'parses %s', ( _name, value, expected ) => {
		expect( parseThreatIds( value ) ).toEqual( expected );
	} );

	it( 'keeps at most 50 ids', () => {
		const value = Array.from( { length: 60 }, ( _, i ) => i + 1 ).join( ',' );
		expect( parseThreatIds( value ) ).toHaveLength( 50 );
	} );
} );

describe( 'groupThreats', () => {
	const active = [ threat( 1, 'current' ), threat( 2, 'current' ) ];
	const history = [ threat( 3, 'fixed' ), threat( 4, 'ignored' ), threat( 2, 'fixed' ) ];

	it.each( [
		[
			'sorts each id into its group, in the URL order',
			[ '9', '3', '2', '4', '1' ],
			{ active, ignored: undefined, history },
			{ active: [ '2', '1' ], fixed: [ '3' ], ignored: [ '4' ], notFound: [ '9' ], pending: [] },
		],
		[
			'leaves unresolved ids pending while history is unknown',
			[ '1', '3', '9' ],
			{ active, ignored: undefined, history: null },
			{ active: [ '1' ], fixed: [], ignored: [], notFound: [], pending: [ '3', '9' ] },
		],
		[
			'prefers the client-held ignored list, which ignore and unignore update first',
			[ '4', '5' ],
			{ active, ignored: [ threat( 5, 'ignored' ) ], history },
			{ active: [], fixed: [], ignored: [ '5' ], notFound: [ '4' ], pending: [] },
		],
		[
			'leaves unresolved ids pending when the active list failed to load',
			[ '1', '3', '9' ],
			{ active: null, ignored: undefined, history },
			{ active: [], fixed: [ '3' ], ignored: [], notFound: [], pending: [ '1', '9' ] },
		],
		[
			'finds an ignored threat before history loads',
			[ '5' ],
			{ active, ignored: [ threat( 5, 'ignored' ) ], history: null },
			{ active: [], fixed: [], ignored: [ '5' ], notFound: [], pending: [] },
		],
	] )( '%s', ( _name, requested, sources, expected ) => {
		const groups = groupThreats( requested, sources );
		expect( {
			active: ids( groups.active ),
			fixed: ids( groups.fixed ),
			ignored: ids( groups.ignored ),
			notFound: groups.notFound,
			pending: groups.pending,
		} ).toEqual( expected );
	} );
} );
